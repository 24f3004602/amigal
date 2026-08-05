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
    });
  }

  // Extend client with soft-delete and slow-query logging
  private getExtendedClient() {
    return this.$extends({
      query: {
        $allModels: {
          async delete({ model, operation, args, query }) {
            return (this as any)[model].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          },
          async deleteMany({ model, operation, args, query }) {
            return (this as any)[model].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          },
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
