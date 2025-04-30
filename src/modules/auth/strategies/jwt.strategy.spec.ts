import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../interfaces/auth.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  // Mock user
  const mockUser = {
    id: 'user-id-1',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  // Mock auth method
  const mockAuthMethod = {
    id: 'auth-method-id-1',
    userId: 'user-id-1',
    type: 'LOCAL',
  };

  // Mock JWT payload
  const mockPayload: JwtPayload = {
    sub: 'user-id-1',
    username: 'testuser',
    type: 'LOCAL' as any,
    authMethodId: 'auth-method-id-1',
  };

  // Mock services
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    authMethod: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  // Mock Logger
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate a token successfully', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.authMethod.findUnique.mockResolvedValue(mockAuthMethod);

      // Call validate method
      const result = await strategy.validate(mockPayload);

      // Assertions
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });
      expect(mockPrismaService.authMethod.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.authMethodId },
      });
      expect(result).toEqual({
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
        authMethodId: mockPayload.authMethodId,
        authType: mockPayload.type,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Call validate method and assert it throws
      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.authMethod.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when auth method is not found', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.authMethod.findUnique.mockResolvedValue(null);

      // Call validate method and assert it throws
      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when auth method belongs to a different user', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.authMethod.findUnique.mockResolvedValue({
        ...mockAuthMethod,
        userId: 'different-user-id',
      });

      // Call validate method and assert it throws
      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('should wrap and rethrow non-UnauthorizedException errors', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Call validate method and assert it throws
      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockPayload)).rejects.toThrow('Authentication failed');
    });
  });
});