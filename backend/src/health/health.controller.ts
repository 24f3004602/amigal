import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { PrismaService } from '../prisma/prisma.service';

// Version-neutral: platform probes hit /health/* directly, without the /v1 prefix
// applied by the global URI versioning in main.ts.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaHealthIndicator,
    private prismaClient: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaClient),
      () => this.redis.pingCheck('redis'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024), // 512MB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),   // 1GB
      () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),
    ]);
  }

  @Get('liveness')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  readiness() {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaClient),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
