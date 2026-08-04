import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { CspInterceptor } from './common/interceptors/csp.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { AuditLogger } from './common/services/audit-logger.service';
// ... other imports

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
      { name: 'strict', ttl: 1000, limit: 5 },    // 5 req/s - auth endpoints
      { name: 'medium', ttl: 60000, limit: 60 },  // 60 req/min - general API
      { name: 'loose', ttl: 3600000, limit: 500 }, // 500 req/hr - read endpoints
    ]),
    // ... other modules
  ],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CspInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    AuditLogger,
  ],
})
export class AppModule {}
