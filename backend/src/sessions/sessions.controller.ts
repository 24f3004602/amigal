import { Controller, Post, Param, Body, UseGuards, Req, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.sessionsService.getHistory(req.user.userId);
  }

  @Post(':id/rate')
  async rate(
    @Param('id') sessionId: string,
    @Req() req: any,
    @Body() body: { rating: number; tags?: string[] },
  ) {
    return this.sessionsService.rateSession(sessionId, req.user.userId, body.rating, body.tags);
  }

  @Post(':id/end')
  async end(@Param('id') sessionId: string, @Req() req: any) {
    return this.sessionsService.endSession(sessionId, req.user.userId);
  }
}
