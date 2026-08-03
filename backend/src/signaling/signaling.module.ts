import { Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { RedisService } from '../common/redis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SignalingGateway, RedisService],
})
export class SignalingModule {}
