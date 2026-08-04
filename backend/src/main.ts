import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { Logger } from 'nestjs-pino';
import { CspInterceptor } from './common/interceptors/csp.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Trust proxy only in production (for accurate IP behind load balancer)
  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Security headers via Helmet (baseline, CSP handled by interceptor)
  app.use(helmet({
    contentSecurityPolicy: false, // We handle this via CspInterceptor with nonces
    crossOriginEmbedderPolicy: false, // Handled in interceptor
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    originAgentCluster: true,
  }));

  app.use(cookieParser());

  // Stripe webhook needs raw body — isolated route
  app.use('/v1/subscriptions/webhook', express.raw({ type: 'application/json' }));

  // Global body parser with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Strict CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
    exposedHeaders: ['X-CSRF-Token', 'X-Request-ID'],
    maxAge: 86400,
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // balance between CPU and size
  threshold: 1024, // only compress responses > 1KB
}));
  
  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
    new SanitizePipe(false), // Strict sanitization by default
  );

  // Global interceptors
  app.useGlobalInterceptors(new CspInterceptor());

  // Replace default throttler guard with custom
  // (In AppModule, change APP_GUARD provider to use CustomThrottlerGuard)

  await app.listen(process.env.PORT || 4000);
  console.log(`Backend running securely on port ${process.env.PORT || 4000}`);
}
bootstrap();
