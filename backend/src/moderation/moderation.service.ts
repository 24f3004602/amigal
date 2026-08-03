import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(
    reporterId: string,
    dto: { sessionId: string; reason: string; chatLog?: string },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    const reportedId = session.userAId === reporterId ? session.userBId : session.userAId;

    const report = await this.prisma.report.create({
      data: {
        sessionId: dto.sessionId,
        reporterId,
        reportedId,
        reason: dto.reason,
        chatLog: dto.chatLog,
      },
    });

    const reportCount = await this.prisma.report.count({
      where: {
        reportedId,
        status: { in: ['pending', 'actioned'] },
      },
    });

    if (reportCount >= 2) {
      await this.prisma.user.update({
        where: { id: reportedId },
        data: {
          isBanned: true,
          banReason: 'Multiple user reports',
          banUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    await this.prisma.user.update({
      where: { id: reportedId },
      data: { reputationScore: { decrement: 30 } },
    });

    await this.prisma.reputationEvent.create({
      data: {
        userId: reportedId,
        change: -30,
        reason: `reported: ${dto.reason}`,
        sessionId: dto.sessionId,
      },
    });

    return report;
  }

  async getMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: { select: { roomId: true, startedAt: true } },
        reported: { select: { displayName: true } },
      },
    });
  }

  async getPendingReports() {
    return this.prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { displayName: true, email: true } },
        reported: { select: { displayName: true, email: true, reputationScore: true } },
        session: { select: { roomId: true, startedAt: true, endedAt: true } },
      },
    });
  }

  async reviewReport(reportId: string, reviewerId: string, action: 'actioned' | 'dismissed') {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    if (action === 'actioned') {
      await this.prisma.user.update({
        where: { id: report.reportedId },
        data: {
          isBanned: true,
          banReason: `Moderator action: ${report.reason}`,
          banUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { success: true };
  }
}
