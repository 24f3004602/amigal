import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly subscriber: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.subscriber = this.client.duplicate();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async defineCommand(name: string, options: { numberOfKeys: number; lua: string }) {
    this.client.defineCommand(name, options);
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
  }
}
