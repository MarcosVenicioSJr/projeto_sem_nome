import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * Login. Body validation is automatic: every DTO is built with
 * createZodDto(), so the global ZodValidationPipe validates it against the
 * @org/contracts schema. Owners are created via POST /tenants and employees
 * or managers by an owner (POST /members/employees).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Owner, manager or employee sign in. */
  @Post('member/login')
  @HttpCode(200)
  loginMember(@Body() dto: LoginDto) {
    return this.authService.loginMember(dto);
  }
}
