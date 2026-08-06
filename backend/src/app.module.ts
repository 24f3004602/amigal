import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { CspInterceptor } from './common/interceptors/csp.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { AuditLogger } from './common/services/audit-logger.service';
import { HealthModule } from './health/health.module';
import { MatchingModule } from './matching/matching.module';
import { MetricsModule } from './metrics/metrics.module';
import { ModerationModule } from './moderation/moderation.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';
import { SignalingModule } from './signaling/signaling.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TurnModule } from './turn/turn.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
        ],
        customProps: (req: unknown) => {
          const typed = req as { id?: unknown; user?: { userId?: string } };
          return {
            requestId: typed.id,
            userId: typed.user?.userId,
          };
        },
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'strict', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 60000, limit: 60 },
      { name: 'loose', ttl: 3600000, limit: 500 },
    ]),
    AnalyticsModule,
    AuthModule,
    ChatModule,
    CommonModule,
    HealthModule,
    HttpModule,
    MatchingModule,
    MetricsModule,
    ModerationModule,
    PrismaModule,
    SessionsModule,
    SignalingModule,
    SubscriptionsModule,
    TurnModule,
    UsersModule,
  ],
  providers: [
    AuditLogger,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CspInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_PIPE, useValue: new SanitizePipe(false) },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  exports: [AuditLogger],
})
export class AppModule {}
