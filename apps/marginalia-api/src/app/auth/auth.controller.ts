import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, UsernameAvailableQueryDto } from './dto/register.dto';
import { VerifyEmailDto, ResendCodeDto } from './dto/verify-email.dto';
import { AcceptTermsDto } from './dto/accept-terms.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Signup and login (Security spec). Body validation is automatic: every DTO
 * is built with createZodDto(), so the global ZodValidationPipe validates it
 * against the @org/contracts schema. No `new ...Pipe()` here.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Step 1 — "Create your account". */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** "helenacardoso ✓ Available" check while typing. */
  @Get('username-available')
  usernameAvailable(@Query() query: UsernameAvailableQueryDto) {
    return this.authService.checkUsernameAvailability(query.u);
  }

  /** Step 2 — "Confirm your email". */
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /** Step 2 — "Resend" the code. */
  @Post('resend-code')
  @HttpCode(202)
  resendCode(@Body() dto: ResendCodeDto) {
    return this.authService.resendCode(dto);
  }

  /** Step 3 — "Terms and privacy". */
  @Post('accept-terms')
  @HttpCode(200)
  acceptTerms(@Body() dto: AcceptTermsDto) {
    return this.authService.acceptTerms(dto);
  }

  /** "Sign in to Marginália" screen. */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
