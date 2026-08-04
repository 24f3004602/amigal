import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { HttpModule } from '@nestjs/axios';

import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { CspInterceptor } from './common/interceptors/csp.interceptor';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditLogger } from './common/services/audit-logger.service';

import { TurnModule } from './turn/turn.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatchingModule } from './matching/matching.module';
import { SignalingModule } from './signaling/signaling.module';
import { ChatModule } from './chat/chat.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ModerationModule } from './moderation/moderation.module';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token'],
        customProps: (req: any) => ({
          requestId: req.id,
          userId: req.user?.userId,
        }),
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'strict', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 60000, limit: 60 },
      { name: 'loose', ttl: 3600000, limit: 500 },
    ]),
    HttpModule,
    TurnModule,
    PrismaModule,
    CommonModule,
    HealthModule,
    MetricsModule,
    AnalyticsModule,
    AuthModule,
    UsersModule,
    MatchingModule,
    SignalingModule,
    ChatModule,
    SubscriptionsModule,
    ModerationModule,
    SessionsModule,
  ],
  providers: [
    AuditLogger,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CspInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_PIPE, useClass: SanitizePipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  exports: [AuditLogger],
})
export class AppModule {}
