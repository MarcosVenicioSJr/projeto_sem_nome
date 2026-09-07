import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../config';
import { DatabaseModule } from '../database';
import { MailModule } from '../mail';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_TTL, JwtAuthGuard } from './jwt';

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
