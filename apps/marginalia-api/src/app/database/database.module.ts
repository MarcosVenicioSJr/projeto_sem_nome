import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config';
import { UserEntity } from './entities/user.entity';
import { VerificationCodeEntity } from './entities/verification-code.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { TermsAcceptanceEntity } from './entities/terms-acceptance.entity';
import { UsersRepository } from './repositories/users.repository';
import { VerificationCodesRepository } from './repositories/verification-codes.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { TermsAcceptancesRepository } from './repositories/terms-acceptances.repository';

const ENTITIES = [
  UserEntity,
  VerificationCodeEntity,
  RefreshTokenEntity,
  TermsAcceptanceEntity,
];

const REPOSITORIES = [
  UsersRepository,
  VerificationCodesRepository,
  RefreshTokensRepository,
  TermsAcceptancesRepository,
];

/**
 * Persistence layer. Opens the connection (forRootAsync, reading ConfigService)
 * and exposes the domain repositories. Auth and User just import this module.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        username: config.get('DB_USER', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
        database: config.get('DB_NAME', { infer: true }),
        entities: ENTITIES,
        // Schema is managed by Atlas (see atlas.hcl / docs/arch/migrations.md).
        // TypeORM never touches the schema.
        synchronize: false,
        logging: config.get('DB_LOGGING', { infer: true }),
      }),
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class DatabaseModule {}
