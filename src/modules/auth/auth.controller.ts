import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email or username already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    this.logger.log(
      `Registration successful for user: ${result.user.username}`,
    );
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`Login successful for user: ${result.user.username}`);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    this.logger.log('Token refresh attempt');
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    this.logger.log(
      `Token refresh successful for user: ${result.user.username}`,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async logout(@Req() req) {
    this.logger.log(`Logout attempt for user ID: ${req.user.userId}`);
    await this.authService.logout(req.user.userId);
    this.logger.log(`Logout successful for user ID: ${req.user.userId}`);
    return { message: 'Logout successful' };
  }

  // Google OAuth routes
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect to Google login page',
  })
  googleAuth() {
    this.logger.log('Initiating Google OAuth authentication flow');
    // The auth guard triggers Google OAuth flow
  }

  @Public()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect to frontend with token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication failed',
  })
  googleAuthCallback(@Req() req, @Res() res: Response) {
    this.logger.log('Processing Google OAuth callback');
    try {
      const { user, token } = req.user;
      if (!user || !token) {
        this.logger.warn('Google OAuth callback failed: Missing user or token');
        throw new UnauthorizedException('Authentication failed');
      }

      this.logger.log(
        `Google OAuth authentication successful for user: ${user.username}`,
      );

      // Redirect to frontend with token
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:4000';
      this.logger.debug(`Redirecting to: ${frontendUrl}/signin?token=****`);
      res.redirect(`${frontendUrl}/signin?token=${token}`);
    } catch (error) {
      this.logger.error(
        `Google OAuth callback error: ${error.message}`,
        error.stack,
      );
      res.redirect('/auth/login?error=Authentication%20failed');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getCurrentUser(@Req() req) {
    this.logger.debug(`Getting profile for user ID: ${req.user.userId}`);
    // User info is already validated by JwtAuthGuard and attached to request
    return { user: req.user };
  }
}
