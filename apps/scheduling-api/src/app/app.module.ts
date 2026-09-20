import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ZodValidationPipe } from './common/zod-validation.pipe';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    TenantModule,
    MemberModule,
    UserModule,
  ],
  providers: [
    // one global pipe; every createZodDto() param is validated automatically
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // one global filter; turns errors into localized HTTP responses
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
