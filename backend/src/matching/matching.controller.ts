import { Controller, Post, Delete, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MatchingService } from './matching.service';
import { FindMatchDto } from './dto';

@Controller('match')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('find')
  async findMatch(@Req() req: any, @Body() dto: FindMatchDto) {
    return this.matchingService.findMatch(req.user.userId, dto);
  }

  @Delete('cancel')
  async cancel(@Req() req: any) {
    return this.matchingService.cancelMatch(req.user.userId);
  }
}
