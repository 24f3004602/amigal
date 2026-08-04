import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

@Injectable()
export class RedisCacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(private redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    await this.redis.getClient().setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.getClient().del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redis.getClient().keys(pattern);
    if (keys.length > 0) {
      await this.redis.getClient().del(...keys);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}:${params[k]}`)
      .join(':');
    return `${prefix}:${sorted}`;
  }
}
