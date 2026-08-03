import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, displayName: true,
        reputationScore: true, totalSessions: true,
        positiveRatings: true, negativeRatings: true,
        videoChatsUsed: true, videoChatsLimit: true,
        subscriptionTier: true, subscriptionStatus: true,
        createdAt: true,
      },
    });
  }

  async getStats(userId: string) {
    const [sessions, reports] = await Promise.all([
      this.prisma.session.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
      this.prisma.report.count({ where: { reporterId: userId } }),
    ]);
    return { totalSessions: sessions, totalReports: reports };
  }

  async updateInterests(userId: string, interests: string[]) {
    await this.prisma.userInterest.deleteMany({ where: { userId } });
    const interestRecords = await this.prisma.interest.findMany({
      where: { name: { in: interests } },
    });
    await this.prisma.userInterest.createMany({
      data: interestRecords.map(i => ({ userId, interestId: i.id })),
      skipDuplicates: true,
    });
    return { interests: interestRecords.map(i => i.name) };
  }
}
