import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool settings
      // These are passed via connection string in production
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Soft delete middleware
    this.$use(async (params, next) => {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data) {
          params.args.data.deletedAt = new Date();
        } else {
          params.args.data = { deletedAt: new Date() };
        }
      }
      return next(params);
    });

    // Query timing middleware for slow query detection
    this.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      }
      
      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper to exclude deleted records by default
  async findManySafe<T>(model: string, args: any = {}): Promise<T[]> {
    return (this as any)[model].findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null,
      },
    });
  }
}
