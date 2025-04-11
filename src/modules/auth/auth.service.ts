import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AuthMethodType, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IUser } from '../user/interfaces/user.interface';
import { IAuthMethod, ILoginData, IRegisterData, IOAuthUser, JwtPayload, AuthResponse } from './interfaces/auth.interface';
import { hashPassword, comparePasswords } from './utils/password.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user with local authentication
   */
  async register(registerData: IRegisterData): Promise<AuthResponse> {
    this.logger.log(`Registering new user with username: ${registerData.username}, email: ${registerData.email}`);
    
    try {
      // Create the user first
      this.logger.debug('Creating user account');
      const user = await this.userService.create({
        username: registerData.username,
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      });

      // Hash the password
      this.logger.debug('Hashing password');
      const hashedPassword = await hashPassword(registerData.password);

      // Create the auth method for this user
      this.logger.debug(`Creating LOCAL auth method for user ID: ${user.id}`);
      const authMethod = await this.prisma.authMethod.create({
        data: {
          userId: user.id,
          type: AuthMethodType.LOCAL,
          identifier: registerData.email.toLowerCase(),
          credential: hashedPassword,
          isVerified: true, // For simplicity - in a real app you might want email verification
        },
      });

      // Generate JWT tokens
      this.logger.debug('Generating auth tokens');
      const { accessToken, refreshToken } = await this.generateTokens(user, authMethod);

      // Store the refresh token
      await this.storeRefreshToken(authMethod.id, refreshToken);

      this.logger.log(`Successfully registered user ID: ${user.id}, username: ${user.username}`);
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        // Re-throw user service conflict exceptions
        this.logger.warn(`Registration failed: ${error.message}`);
        throw error;
      }
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const errorMsg = 'User with this email or username already exists';
          this.logger.warn(`Registration failed: ${errorMsg}`);
          throw new ConflictException(errorMsg);
        }
      }
      
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(loginData: ILoginData): Promise<AuthResponse> {
    this.logger.log(`Login attempt for email: ${loginData.email}`);
    
    // First, find user by email
    const user = await this.userService.findByEmail(loginData.email.toLowerCase());
    if (!user) {
      this.logger.warn(`Login failed: No user found with email ${loginData.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.debug(`Found user with ID: ${user.id}, username: ${user.username}`);
    
    // Find local auth method for this user
    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        userId: user.id,
        type: AuthMethodType.LOCAL,
        identifier: loginData.email.toLowerCase(),
      },
    });

    if (!authMethod) {
      this.logger.warn(`Login failed: No LOCAL auth method found for user ${user.id}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (authMethod.lockedUntil && authMethod.lockedUntil > new Date()) {
      const lockExpiry = authMethod.lockedUntil.toISOString();
      this.logger.warn(`Login failed: Account locked until ${lockExpiry} for user ${user.id}`);
      throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
    }

    // Verify password
    const isPasswordValid = authMethod.credential && 
                           await comparePasswords(loginData.password, authMethod.credential);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = authMethod.failedAttempts + 1;
      this.logger.warn(`Invalid password for user ${user.id}. Failed attempts: ${failedAttempts}`);
      
      // Lock account if too many failed attempts (e.g., 5)
      const maxFailedAttempts = 5;
      const lockDurationMinutes = 15;
      let lockedUntil = null;
      
      if (failedAttempts >= maxFailedAttempts) {
        lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
        this.logger.warn(`Account locked until ${lockedUntil.toISOString()} for user ${user.id}`);
      }
      
      // Update auth method
      await this.prisma.authMethod.update({
        where: { id: authMethod.id },
        data: {
          failedAttempts,
          lockedUntil,
        },
      });
      
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.debug(`Password verified for user ${user.id}`);
    
    // Reset failed attempts on successful login
    await this.prisma.authMethod.update({
      where: { id: authMethod.id },
      data: {
        failedAttempts: 0,
        lastUsedAt: new Date(),
      },
    });

    // Generate tokens
    this.logger.debug(`Generating tokens for user ${user.id}`);
    const { accessToken, refreshToken } = await this.generateTokens(user, authMethod);

    // Store refresh token
    await this.storeRefreshToken(authMethod.id, refreshToken);

    this.logger.log(`User ${user.id} (${user.username}) logged in successfully`);
    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Validate and process OAuth login
   */
  async validateOAuthLogin(
    oauthUser: IOAuthUser,
    accessToken: string,
    refreshToken: string,
  ): Promise<{ user: IUser; accessToken: string }> {
    this.logger.log(`OAuth login attempt for ${oauthUser.provider} user with email: ${oauthUser.email}`);
    
    try {
      // First, check if user exists with this email
      this.logger.debug(`Checking if user exists with email: ${oauthUser.email}`);
      let user = await this.userService.findByEmail(oauthUser.email.toLowerCase());
      
      if (!user) {
        // Register new user if doesn't exist
        this.logger.debug(`User not found, creating new user with username: ${oauthUser.username}`);
        user = await this.userService.create({
          username: oauthUser.username,
          email: oauthUser.email.toLowerCase(),
          firstName: oauthUser.firstName,
          lastName: oauthUser.lastName,
          avatarUrl: oauthUser.avatarUrl,
        });
      } else {
        this.logger.debug(`Found existing user: ${user.id} (${user.username})`);
      }
      
      // Check if auth method exists for this user and provider
      this.logger.debug(`Checking for existing ${oauthUser.provider} auth method for user: ${user.id}`);
      let authMethod = await this.prisma.authMethod.findFirst({
        where: {
          userId: user.id,
          type: oauthUser.provider,
          identifier: oauthUser.providerId,
        },
      });
      
      if (!authMethod) {
        // Create new auth method if it doesn't exist
        this.logger.debug(`Creating new ${oauthUser.provider} auth method for user: ${user.id}`);
        authMethod = await this.prisma.authMethod.create({
          data: {
            userId: user.id,
            type: oauthUser.provider,
            identifier: oauthUser.providerId,
            credential: null, // OAuth doesn't need password
            refreshToken: refreshToken, // Store OAuth refresh token
            isVerified: true, // OAuth users are pre-verified
            lastUsedAt: new Date(),
          },
        });
      } else {
        // Update last used time and refresh token
        this.logger.debug(`Updating existing ${oauthUser.provider} auth method for user: ${user.id}`);
        await this.prisma.authMethod.update({
          where: { id: authMethod.id },
          data: {
            refreshToken,
            lastUsedAt: new Date(),
          },
        });
      }
      
      // Generate only access token (no need for our refresh token as we use OAuth's)
      this.logger.debug(`Generating JWT token for user: ${user.id}`);
      const jwtToken = this.generateAccessToken(user, authMethod);
      
      this.logger.log(`OAuth login successful for user: ${user.id} (${user.username})`);
      return {
        user,
        accessToken: jwtToken,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(`OAuth login failed due to conflict: ${error.message}`);
        throw error;
      }
      this.logger.error(`OAuth login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    this.logger.log('Token refresh requested');
    
    try {
      // Verify the token first without checking the database
      // This throws an error if the token is invalid or expired
      this.logger.debug('Verifying JWT signature');
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as JwtPayload;

      this.logger.debug(`Token payload verified for user ID: ${payload.sub}`);
      
      // Find the token in the database
      this.logger.debug('Looking up token in database');
      const tokenRecord = await this.prisma.token.findFirst({
        where: {
          token: refreshToken,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          authMethod: true,
        },
      });

      if (!tokenRecord) {
        this.logger.warn(`Token refresh failed: Token not found or already revoked`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user and auth method
      this.logger.debug(`Getting user for ID: ${payload.sub}`);
      const user = await this.userService.findOne(payload.sub);
      const authMethod = tokenRecord.authMethod;

      // Check if token belongs to the right user and auth method
      if (
        authMethod.userId !== user.id ||
        authMethod.id !== payload.authMethodId
      ) {
        this.logger.warn(`Token refresh failed: Token mismatch for user ${user.id} and auth method ${authMethod.id}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke the old token
      this.logger.debug(`Revoking old token ID: ${tokenRecord.id}`);
      await this.prisma.token.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      // Generate new tokens
      this.logger.debug(`Generating new tokens for user ${user.id}`);
      const newTokens = await this.generateTokens(user, authMethod);

      // Store the new refresh token
      await this.storeRefreshToken(authMethod.id, newTokens.refreshToken);

      this.logger.log(`Token refresh successful for user ${user.id}`);
      return {
        ...newTokens,
        user
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user by revoking all their refresh tokens
   */
  async logout(userId: string): Promise<void> {
    this.logger.log(`Logging out user: ${userId}`);
    
    try {
      // Find all auth methods for the user
      this.logger.debug(`Finding auth methods for user: ${userId}`);
      const authMethods = await this.prisma.authMethod.findMany({
        where: { userId },
        select: { id: true },
      });

      if (authMethods.length === 0) {
        this.logger.warn(`No auth methods found for user: ${userId}`);
        return;
      }
      
      const authMethodIds = authMethods.map(method => method.id);
      this.logger.debug(`Found ${authMethods.length} auth methods: ${authMethodIds.join(', ')}`);

      // Revoke all refresh tokens
      const result = await this.prisma.token.updateMany({
        where: {
          authMethodId: { in: authMethodIds },
          revoked: false,
        },
        data: { revoked: true },
      });

      this.logger.log(`Revoked ${result.count} tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error during logout for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generates both access and refresh tokens
   */
  private async generateTokens(
    user: IUser,
    authMethod: IAuthMethod,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Create JWT payload
    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      type: authMethod.type,
      authMethodId: authMethod.id,
    };

    // Generate access token - short lived (15 min)
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: '15m',
    });

    // Generate refresh token - longer lived (7 days)
    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generates just an access token
   */
  private generateAccessToken(user: IUser, authMethod: IAuthMethod): string {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      type: authMethod.type,
      authMethodId: authMethod.id,
    };

    return this.jwtService.sign(jwtPayload, {
      expiresIn: '15m',
    });
  }

  /**
   * Stores a refresh token in the database
   */
  private async storeRefreshToken(authMethodId: string, refreshToken: string): Promise<void> {
    // Store the token with a 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.token.create({
      data: {
        authMethodId,
        token: refreshToken,
        expiresAt,
      },
    });
  }

  /**
   * Daily job to clean up expired tokens
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    const deleted = await this.prisma.token.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        revoked: false,
      },
    });
    
    this.logger.log(`Cleaned up ${deleted.count} expired tokens`);
  }
}