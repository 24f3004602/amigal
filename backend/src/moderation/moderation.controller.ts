import { Controller, Post, Body, UseGuards, Req, Get, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ModerationService } from './moderation.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  async createReport(
    @Req() req: any,
    @Body() body: { sessionId: string; reason: string; chatLog?: string },
  ) {
    return this.moderationService.createReport(req.user.userId, body);
  }

  @Get('my')
  async myReports(@Req() req: any) {
    return this.moderationService.getMyReports(req.user.userId);
  }
}

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard)
export class AdminModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  async getQueue(@Req() req: any) {
    return this.moderationService.getPendingReports();
  }

  @Put(':id/review')
  async reviewReport(
    @Param('id') reportId: string,
    @Req() req: any,
    @Body() body: { action: 'actioned' | 'dismissed' },
  ) {
    return this.moderationService.reviewReport(reportId, req.user.userId, body.action);
  }
}
