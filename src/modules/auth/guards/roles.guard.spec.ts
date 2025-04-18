import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { UserRole } from '../../user/interfaces/user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prismaService: PrismaService;

  // Mock services
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  // Mock execution context
  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  };

  // Mock request with authenticated user
  const mockRequest = {
    user: {
      userId: 'user-id-1',
      username: 'testuser',
    },
  };

  // Mock Logger
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should allow access when empty roles array is required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should deny access when no user is in request', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue({});

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should allow access when user has required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        role: UserRole.ADMIN,
      });

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockRequest.user.userId },
        select: { role: true },
      });
      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.MODERATOR]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        role: UserRole.MODERATOR,
      });

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user doesn\'t have required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        role: UserRole.USER,
      });

      await expect(
        guard.canActivate(mockExecutionContext as unknown as ExecutionContext)
      ).rejects.toThrow(ForbiddenException);
      
      await expect(
        guard.canActivate(mockExecutionContext as unknown as ExecutionContext)
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should return false when user is not found', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when database error occurs', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(false);
    });
  });
});