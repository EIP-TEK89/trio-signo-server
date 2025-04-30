import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthMethodType } from '@prisma/client';
import { IUser, UserRole } from '../user/interfaces/user.interface';
import * as passwordUtils from './utils/password.util';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Mock type to allow any mock function calls without TypeScript errors
type MockFn = jest.Mock & Record<string, jest.Mock>;

// Mock the password utilities
jest.mock('./utils/password.util', () => ({
  hashPassword: jest.fn().mockImplementation(async (password) => `hashed_${password}`),
  comparePasswords: jest.fn().mockImplementation(async (plain, hashed) => 
    plain === 'correctPassword' && hashed === 'hashed_correctPassword'
  ),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: { [key: string]: any };
  let jwtService: { [key: string]: any };
  let userService: { [key: string]: any };
  let configService: { [key: string]: any };

  // Mock user for testing
  const mockUser: IUser = {
    id: 'user-id-1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: UserRole.USER,
  };

  // Mock auth method
  const mockAuthMethod = {
    id: 'auth-method-id-1',
    userId: 'user-id-1',
    type: AuthMethodType.LOCAL,
    identifier: 'test@example.com',
    credential: 'hashed_correctPassword',
    refreshToken: null,
    isVerified: true,
    lastUsedAt: new Date(),
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock token
  const mockToken = {
    id: 'token-id-1',
    authMethodId: 'auth-method-id-1',
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
    createdAt: new Date(),
    revoked: false,
    authMethod: mockAuthMethod,
  };

  // Mock Logger
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  beforeEach(async () => {
    // Create mock services
    const mockPrismaService = {
      authMethod: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      token: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrismaService)),
    };

    const mockJwtService = {
      sign: jest.fn().mockImplementation((payload, options) => {
        if (options.expiresIn === '15m') {
          return 'mock-access-token';
        } else {
          return 'mock-refresh-token';
        }
      }),
      verify: jest.fn(),
    };

    const mockUserService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
    configService = module.get(ConfigService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      // Setup mocks
      const newUser = { ...mockUser, id: 'new-user-id', username: registerData.username, email: registerData.email };
      userService.create.mockResolvedValue(newUser);
      prismaService.authMethod.create.mockResolvedValue({
        ...mockAuthMethod,
        id: 'new-auth-method-id',
        userId: newUser.id,
        identifier: registerData.email,
        credential: 'hashed_password123',
      });
      prismaService.token.create.mockResolvedValue({
        id: 'new-token-id',
        authMethodId: 'new-auth-method-id',
        token: 'mock-refresh-token',
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        revoked: false,
      });

      // Call method
      const result = await service.register(registerData);

      // Assertions
      expect(userService.create).toHaveBeenCalledWith({
        username: registerData.username,
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(prismaService.authMethod.create).toHaveBeenCalledWith({
        data: {
          userId: newUser.id,
          type: AuthMethodType.LOCAL,
          identifier: registerData.email.toLowerCase(),
          credential: 'hashed_password123',
          isVerified: true,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prismaService.token.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: newUser,
      });
    });

    it('should throw ConflictException when user with email already exists', async () => {
      userService.create.mockRejectedValue(new ConflictException('User with this email already exists'));

      await expect(service.register(registerData)).rejects.toThrow(ConflictException);
      expect(userService.create).toHaveBeenCalled();
      expect(prismaService.authMethod.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when Prisma unique constraint violation occurs', async () => {
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: { target: ['email'] },
      });

      userService.create.mockResolvedValue(mockUser);
      prismaService.authMethod.create.mockRejectedValue(prismaError);

      await expect(service.register(registerData)).rejects.toThrow(ConflictException);
      expect(userService.create).toHaveBeenCalled();
      expect(prismaService.authMethod.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'correctPassword',
    };

    beforeEach(() => {
      userService.findByEmail.mockResolvedValue(mockUser);
      prismaService.authMethod.findFirst.mockResolvedValue(mockAuthMethod);
      prismaService.token.create.mockResolvedValue({
        id: 'token-id-1',
        authMethodId: 'auth-method-id-1',
        token: 'mock-refresh-token',
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        revoked: false,
      });
    });

    it('should login a user successfully with correct credentials', async () => {
      // Call method
      const result = await service.login(loginData);

      // Assertions
      expect(userService.findByEmail).toHaveBeenCalledWith(loginData.email.toLowerCase());
      expect(prismaService.authMethod.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          type: AuthMethodType.LOCAL,
          identifier: loginData.email.toLowerCase(),
        },
      });
      expect(passwordUtils.comparePasswords).toHaveBeenCalledWith(
        loginData.password,
        mockAuthMethod.credential
      );
      expect(prismaService.authMethod.update).toHaveBeenCalledWith({
        where: { id: mockAuthMethod.id },
        data: {
          failedAttempts: 0,
          lastUsedAt: expect.any(Date),
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prismaService.token.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.authMethod.findFirst).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when auth method is not found', async () => {
      prismaService.authMethod.findFirst.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      expect(passwordUtils.comparePasswords).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes in the future
      prismaService.authMethod.findFirst.mockResolvedValue({
        ...mockAuthMethod,
        lockedUntil,
      });

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      expect(passwordUtils.comparePasswords).not.toHaveBeenCalled();
    });

    it('should increment failed attempts and throw UnauthorizedException when password is incorrect', async () => {
      jest.spyOn(passwordUtils, 'comparePasswords').mockResolvedValueOnce(false);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.authMethod.update).toHaveBeenCalledWith({
        where: { id: mockAuthMethod.id },
        data: {
          failedAttempts: 1,
          lockedUntil: null,
        },
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      jest.spyOn(passwordUtils, 'comparePasswords').mockResolvedValueOnce(false);
      
      prismaService.authMethod.findFirst.mockResolvedValue({
        ...mockAuthMethod,
        failedAttempts: 4, // One more failure will lock
      });

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      expect(prismaService.authMethod.update).toHaveBeenCalledWith({
        where: { id: mockAuthMethod.id },
        data: {
          failedAttempts: 5,
          lockedUntil: expect.any(Date),
        },
      });
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      prismaService.token.findFirst.mockResolvedValue(mockToken);
      userService.findOne.mockResolvedValue(mockUser);
      jwtService.verify.mockImplementation((token) => {
        if (token === 'valid-refresh-token') {
          return { 
            sub: 'user-id-1', 
            username: 'testuser',
            type: AuthMethodType.LOCAL,
            authMethodId: 'auth-method-id-1'
          };
        } else {
          throw new Error('Invalid token');
        }
      });
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      // Call method
      const result = await service.refreshToken('valid-refresh-token');

      // Assertions
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-secret',
      });
      expect(prismaService.token.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid-refresh-token',
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        include: {
          authMethod: true,
        },
      });
      expect(userService.findOne).toHaveBeenCalledWith('user-id-1');
      expect(prismaService.token.update).toHaveBeenCalledWith({
        where: { id: mockToken.id },
        data: { revoked: true },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prismaService.token.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      expect(prismaService.token.findFirst).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is not found in database', async () => {
      prismaService.token.findFirst.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
      expect(userService.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token belongs to different user', async () => {
      const differentUser = { ...mockUser, id: 'different-user-id' };
      userService.findOne.mockResolvedValue(differentUser);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
      expect(prismaService.token.update).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      prismaService.authMethod.findMany.mockResolvedValue([
        { id: 'auth-method-id-1' },
        { id: 'auth-method-id-2' },
      ]);
      prismaService.token.updateMany.mockResolvedValue({ count: 3 });
    });

    it('should revoke all refresh tokens for a user', async () => {
      // Call method
      await service.logout('user-id-1');

      // Assertions
      expect(prismaService.authMethod.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id-1' },
        select: { id: true },
      });
      expect(prismaService.token.updateMany).toHaveBeenCalledWith({
        where: {
          authMethodId: { in: ['auth-method-id-1', 'auth-method-id-2'] },
          revoked: false,
        },
        data: { revoked: true },
      });
    });

    it('should do nothing if no auth methods are found', async () => {
      prismaService.authMethod.findMany.mockResolvedValue([]);

      await service.logout('user-id-1');

      expect(prismaService.token.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('validateOAuthLogin', () => {
    const oauthUser = {
      email: 'oauth@example.com',
      username: 'oauthuser',
      firstName: 'OAuth',
      lastName: 'User',
      avatarUrl: 'https://example.com/avatar.jpg',
      provider: AuthMethodType.GOOGLE,
      providerId: 'google-id-123',
    };

    it('should create a new user when OAuth user does not exist', async () => {
      // Setup
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue({
        ...mockUser,
        id: 'oauth-user-id',
        username: oauthUser.username,
        email: oauthUser.email,
      });
      prismaService.authMethod.findFirst.mockResolvedValue(null);
      prismaService.authMethod.create.mockResolvedValue({
        id: 'oauth-auth-method-id',
        userId: 'oauth-user-id',
        type: AuthMethodType.GOOGLE,
        identifier: oauthUser.providerId,
        credential: null,
        refreshToken: 'oauth-refresh-token',
        isVerified: true,
        lastUsedAt: expect.any(Date),
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Call
      const result = await service.validateOAuthLogin(
        oauthUser,
        'oauth-access-token',
        'oauth-refresh-token'
      );

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith(oauthUser.email.toLowerCase());
      expect(userService.create).toHaveBeenCalledWith({
        username: oauthUser.username,
        email: oauthUser.email.toLowerCase(),
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        avatarUrl: oauthUser.avatarUrl,
      });
      expect(prismaService.authMethod.create).toHaveBeenCalledWith({
        data: {
          userId: 'oauth-user-id',
          type: AuthMethodType.GOOGLE,
          identifier: oauthUser.providerId,
          credential: null,
          refreshToken: 'oauth-refresh-token',
          isVerified: true,
          lastUsedAt: expect.any(Date),
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        user: {
          ...mockUser,
          id: 'oauth-user-id',
          username: oauthUser.username,
          email: oauthUser.email,
        },
        accessToken: 'mock-access-token',
      });
    });

    it('should update existing OAuth auth method', async () => {
      // Setup
      userService.findByEmail.mockResolvedValue(mockUser);
      prismaService.authMethod.findFirst.mockResolvedValue({
        ...mockAuthMethod,
        type: AuthMethodType.GOOGLE,
        identifier: oauthUser.providerId,
      });

      // Call
      const result = await service.validateOAuthLogin(
        oauthUser,
        'oauth-access-token',
        'oauth-refresh-token'
      );

      // Assert
      expect(prismaService.authMethod.update).toHaveBeenCalledWith({
        where: { id: mockAuthMethod.id },
        data: {
          refreshToken: 'oauth-refresh-token',
          lastUsedAt: expect.any(Date),
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'mock-access-token',
      });
    });

    it('should create new auth method for existing user', async () => {
      // Setup
      userService.findByEmail.mockResolvedValue(mockUser);
      prismaService.authMethod.findFirst.mockResolvedValue(null);
      prismaService.authMethod.create.mockResolvedValue({
        ...mockAuthMethod,
        type: AuthMethodType.GOOGLE,
        identifier: oauthUser.providerId,
      });

      // Call
      const result = await service.validateOAuthLogin(
        oauthUser,
        'oauth-access-token',
        'oauth-refresh-token'
      );

      // Assert
      expect(prismaService.authMethod.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          type: AuthMethodType.GOOGLE,
          identifier: oauthUser.providerId,
          credential: null,
          refreshToken: 'oauth-refresh-token',
          isVerified: true,
          lastUsedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'mock-access-token',
      });
    });

    it('should propagate ConflictException from user creation', async () => {
      // Setup
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockRejectedValue(new ConflictException('Username already taken'));

      // Assert
      await expect(
        service.validateOAuthLogin(oauthUser, 'oauth-access-token', 'oauth-refresh-token')
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException for other errors', async () => {
      // Setup
      userService.findByEmail.mockRejectedValue(new Error('Database error'));

      // Assert
      await expect(
        service.validateOAuthLogin(oauthUser, 'oauth-access-token', 'oauth-refresh-token')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      prismaService.token.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredTokens();

      expect(prismaService.token.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          revoked: false,
        },
      });
    });
  });
});