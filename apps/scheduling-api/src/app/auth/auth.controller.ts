import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Signup and login. Body validation is automatic: every DTO is built with
 * createZodDto(), so the global ZodValidationPipe validates it against the
 * @org/contracts schema. Owners are created via POST /tenants and employees
 * by their owner (POST /members/employees).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Client signup (global account). */
  @Post('client/register')
  registerClient(@Body() dto: RegisterDto) {
    return this.authService.registerClient(dto);
  }

  @Post('client/login')
  @HttpCode(200)
  loginClient(@Body() dto: LoginDto) {
    return this.authService.loginClient(dto);
  }

  /** Owner or employee sign in. */
  @Post('member/login')
  @HttpCode(200)
  loginMember(@Body() dto: LoginDto) {
    return this.authService.loginMember(dto);
  }
}
