import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from './redis.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: (env) => {
      if (!env.JWT_SECRET) throw new Error('JWT_SECRET is required');
      if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
      return env;
    }}),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [RedisService, WsJwtGuard],
  exports: [RedisService, JwtModule, ConfigModule],
})
export class CommonModule {}
