import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { MemberController, TeamController } from './member.controller';
import { MemberService } from './member.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [MemberController, TeamController],
  providers: [MemberService],
})
export class MemberModule {}
