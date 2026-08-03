import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      // Auto-enable TLS only if URL starts with rediss://
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  defineCommand(name: string, options: { numberOfKeys: number; lua: string }) {
    return (this.client as any).defineCommand(name, options);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
