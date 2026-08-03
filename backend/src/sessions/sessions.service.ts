import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string) {
    return this.prisma.session.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        endedAt: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        roomId: true,
        mode: true,
        startedAt: true,
        endedAt: true,
        durationSeconds: true,
        terminationReason: true,
        interestOverlap: true,
        rating: true,
        userA: { select: { id: true, displayName: true } },
        userB: { select: { id: true, displayName: true } },
      },
    });
  }

  async rateSession(sessionId: string, userId: string, rating: number, tags?: string[]) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    const isParticipant = session.userAId === userId || session.userBId === userId;
    if (!isParticipant) throw new ForbiddenException('Not your session');

    const partnerId = session.userAId === userId ? session.userBId : session.userAId;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { rating, ratingTags: tags || [] },
    });

    if (rating >= 4) {
      await this.prisma.user.update({
        where: { id: partnerId },
        data: {
          reputationScore: { increment: 15 },
          positiveRatings: { increment: 1 },
        },
      });
      await this.prisma.reputationEvent.create({
        data: {
          userId: partnerId,
          change: 15,
          reason: 'positive rating',
          sessionId,
        },
      });
    } else if (rating <= 2) {
      await this.prisma.user.update({
        where: { id: partnerId },
        data: {
          reputationScore: { decrement: 10 },
          negativeRatings: { increment: 1 },
        },
      });
      await this.prisma.reputationEvent.create({
        data: {
          userId: partnerId,
          change: -10,
          reason: 'negative rating',
          sessionId,
        },
      });
    }

    return { success: true };
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    const isParticipant = session.userAId === userId || session.userBId === userId;
    if (!isParticipant) throw new ForbiddenException('Not your session');

    const now = new Date();
    const duration = session.startedAt
      ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
      : null;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: now,
        durationSeconds: duration,
        terminationReason: 'normal',
      },
    });

    if (session.mode === 'video') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { videoChatsUsed: { increment: 1 } },
      });
    }

    return { success: true, durationSeconds: duration };
  }
}
