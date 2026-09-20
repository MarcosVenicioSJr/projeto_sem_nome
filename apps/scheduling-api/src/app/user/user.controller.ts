import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/jwt';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * The authenticated caller's own profile (owner, employee or client). The
 * identity comes from the access token (JwtAuthGuard + @CurrentUser). Account
 * creation lives in AuthController / TenantController / MemberController.
 */
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@CurrentUser() caller: AccessTokenPayload) {
    return this.userService.findMe(caller);
  }

  /** Employees cannot edit their own data: every edit goes through the owner. */
  @Patch('me')
  @Roles('owner', 'client')
  updateProfile(
    @CurrentUser() caller: AccessTokenPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(caller, dto);
  }
}
