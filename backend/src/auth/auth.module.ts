import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy],
  exports: [AuthService],
})
export class AuthModule {}
