import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { UserRole } from '../user/interfaces/user.interface';
import { IUser } from '../user/interfaces/user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock user
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

  // Auth response with tokens
  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  };

  // Mock services
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    }),
  };

  // Mock response object
  const mockResponse = () => {
    const res: any = {};
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  // Mock Logger
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should propagate exceptions from service', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(registerDto)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login a user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should propagate exceptions from service', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should propagate exceptions from service', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const mockRequest = {
      user: {
        userId: 'user-id-1',
        username: 'testuser',
      },
    };

    it('should logout a user successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith(mockRequest.user.userId);
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should propagate exceptions from service', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout(mockRequest)).rejects.toThrow('Logout failed');
    });
  });

  describe('googleAuth', () => {
    it('should not do anything - just initialize Google OAuth flow', () => {
      controller.googleAuth();
      // No assertions needed as the method doesn't do anything directly
    });
  });

  describe('googleAuthCallback', () => {
    const mockReq = {
      user: {
        user: mockUser,
        token: 'oauth-token',
      },
    };

    it('should redirect to frontend with token on successful OAuth', () => {
      const res = mockResponse();
      
      controller.googleAuthCallback(mockReq, res as any);
      
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?token=oauth-token');
    });

    it('should redirect to error page when user or token is missing', () => {
      const res = mockResponse();
      const invalidReq = { user: {} };
      
      controller.googleAuthCallback(invalidReq, res as any);
      
      expect(res.redirect).toHaveBeenCalledWith('/auth/login?error=Authentication%20failed');
    });

    it('should redirect to error page when an exception occurs', () => {
      const res = mockResponse();
      res.redirect = jest.fn().mockImplementationOnce(() => {
        throw new Error('Redirect failed');
      });
      
      controller.googleAuthCallback(mockReq, res as any);
      
      expect(res.redirect).toHaveBeenCalledTimes(2);
      expect(res.redirect).toHaveBeenLastCalledWith('/auth/login?error=Authentication%20failed');
    });
  });

  describe('getCurrentUser', () => {
    const mockRequest = {
      user: {
        userId: 'user-id-1',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      },
    };

    it('should return the current user', async () => {
      const result = await controller.getCurrentUser(mockRequest);
      
      expect(result).toEqual({ user: mockRequest.user });
    });
  });
});