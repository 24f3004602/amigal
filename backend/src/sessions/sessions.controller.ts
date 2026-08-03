import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private prisma: PrismaService) {}

  @Post('end')
  async endSession(@Body() body: { roomId: string }) {
    await this.prisma.session.updateMany({
      where: { roomId: body.roomId },
      data: {
        endedAt: new Date(),
        terminationReason: 'normal',
      },
    });
    return { success: true };
  }
}
