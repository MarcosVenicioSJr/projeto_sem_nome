import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt';
import { UserService } from './user.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * Authenticated user's profile. The `id` comes from the access token (via
 * JwtAuthGuard + @CurrentUser), not a fixed value. Account creation lives in
 * AuthController.
 */
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.userService.findById(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Put('me/preferences')
  updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.userService.updatePreferences(userId, dto);
  }
}
