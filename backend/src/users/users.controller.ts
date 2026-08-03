import { Controller, Get, Put, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateInterestsDto } from './dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get('me/stats')
  getStats(@Req() req: any) {
    return this.usersService.getStats(req.user.userId);
  }

  @Put('me/interests')
  updateInterests(@Req() req: any, @Body() dto: UpdateInterestsDto) {
    return this.usersService.updateInterests(req.user.userId, dto.interests);
  }
}
