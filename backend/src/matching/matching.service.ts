import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { FindMatchDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

const MATCH_LUA = `
local queueKey = KEYS[1]
local userKey = KEYS[2]
local candidateKey = KEYS[3]
local userId = ARGV[1]
local candidateId = ARGV[2]
local roomId = ARGV[3]
local timestamp = ARGV[4]
local candidateStatus = redis.call('hget', candidateKey, 'status')
if candidateStatus ~= 'waiting' then return nil end
redis.call('zrem', queueKey, userId, candidateId)
redis.call('del', userKey, candidateKey)
redis.call('hset', 'match:' .. roomId, 'userA', candidateId, 'userB', userId, 'created', timestamp)
return {candidateId, roomId}
`;

@Injectable()
export class MatchingService {
    constructor(private prisma: PrismaService, private redis: RedisService) {
    this.redis.defineCommand('atomicMatch', {
      numberOfKeys: 3,
      lua: MATCH_LUA,
    });
  }

  async findMatch(userId: string, dto: FindMatchDto) {
    if (dto.mode === 'video') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { videoChatsUsed: true, videoChatsLimit: true, subscriptionTier: true },
      });
      if (!user) throw new ForbiddenException('User not found');
      if (user.videoChatsUsed >= user.videoChatsLimit && user.subscriptionTier === 'free') {
        throw new ForbiddenException('Video chat limit reached. Upgrade to continue.');
      }
    }

    const redis = this.redis.getClient();
    const queueKey = `queue:${dto.mode}`;
    const userKey = `match:user:${userId}`;
    const timestamp = Date.now();

    await redis.zadd(queueKey, timestamp, userId);
    await redis.hset(userKey, {
      interests: JSON.stringify(dto.interests),
      region: dto.region || '',
      mode: dto.mode,
      status: 'waiting',
      joinedAt: timestamp,
    });

    const candidates = await redis.zrange(queueKey, 0, 50);
    for (const candidateId of candidates) {
      if (candidateId === userId) continue;
      const candidateData = await redis.hgetall(`match:user:${candidateId}`);
      if (!candidateData || candidateData.status !== 'waiting') continue;
      const candidateInterests = JSON.parse(candidateData.interests || '[]');
      const similarity = this.jaccardSimilarity(dto.interests, candidateInterests);
      if (similarity >= 0) {
        const roomId = uuidv4();
        const candidateKey = `match:user:${candidateId}`;
        try {
          const result = await (redis as any).atomicMatch(
            queueKey, userKey, candidateKey,
            userId, candidateId, roomId, timestamp
          );
          if (result) {
            await this.prisma.session.create({
              data: {
                roomId,
                userAId: candidateId,
                userBId: userId,
                mode: dto.mode,
                interestOverlap: similarity,
                regionMatch: dto.region ? dto.region === candidateData.region : null,
              },
            });
            await redis.publish(`user:${candidateId}:match`, JSON.stringify({ roomId, partnerId: userId, interests: dto.interests }));
            await redis.publish(`user:${userId}:match`, JSON.stringify({ roomId, partnerId: candidateId, interests: candidateInterests }));
            return { status: 'matched', roomId, partnerId: candidateId, similarity };
          }
        } catch (err) {
          continue;
        }
      }
    }
    return { status: 'waiting', message: 'Looking for a match...' };
  }

  async cancelMatch(userId: string) {
    const redis = this.redis.getClient();
    await redis.zrem('queue:text', userId);
    await redis.zrem('queue:video', userId);
    await redis.del(`match:user:${userId}`);
    return { status: 'cancelled' };
  }

  private jaccardSimilarity(a: string[], b: string[]): number {
    if (a.length === 0 && b.length === 0) return 1;
    const intersection = new Set(a.filter(x => b.includes(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }
}
