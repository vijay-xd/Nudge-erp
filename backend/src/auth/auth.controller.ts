import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new organization and admin account' })
  @ApiResponse({ status: 201, description: 'Organization and admin registered successfully' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT access & refresh tokens' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and exchange a refresh token for new access & refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid, revoked, or expired refresh token' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active refresh token and end session' })
  @ApiResponse({ status: 200, description: 'Session terminated successfully' })
  async logout(@Body() refreshDto: RefreshDto) {
    return this.authService.logout(refreshDto.refreshToken);
  }
}
