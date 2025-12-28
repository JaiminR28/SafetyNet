/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Get model names from Prisma client
    const modelNames = this.getModelNames();

    const deletePromises = modelNames.map((modelName): any => {
      const model = this[modelName as keyof this];
      if (model && typeof model === 'object' && 'deleteMany' in model) {
        return (model as any).deleteMany({});
      }
      return Promise.resolve();
    });

    return Promise.all(deletePromises);
  }

  private getModelNames(): string[] {
    // Prisma models are properties that start with lowercase and are not $methods
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
      (name) =>
        name[0] === name[0].toLowerCase() &&
        !name.startsWith('$') &&
        name !== 'constructor',
    );
  }
}
