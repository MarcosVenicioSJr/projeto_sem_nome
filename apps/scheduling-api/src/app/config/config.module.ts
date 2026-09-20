import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';

/**
 * Global config. `envFilePath` points at the monorepo-root `.env` (the same
 * file docker-compose uses) and, if present, a per-app one.
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['apps/scheduling-api/.env', '.env'],
      validate: validateEnv,
    }),
  ],
})
export class ConfigModule {}
