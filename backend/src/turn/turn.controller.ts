import { Controller, Get, UseGuards } from '@nestjs/common';
import { TurnService } from './turn.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiResponseInterceptor } from '../common/interceptors/api-response.interceptor';

@Controller('turn')
@UseGuards(JwtAuthGuard)
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get('credentials')
  async getCredentials() {
    const servers = await this.turnService.getIceServers();
    return { servers, timestamp: Date.now() };
  }
}
