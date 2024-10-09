import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './authtests.model';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUser: User & { createdAt: Date; updatedAt: Date } = {
    id: '1',
    email: 'test@test.com',
    password: 'hashedPassword',
    username: 'testuser',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockedJwtToken'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null if credentials are invalid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const result = await service.validateUser('invalid@test.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token on successful login', async () => {
      const result = await service.login(mockUser);
      expect(result).toEqual({ access_token: 'mockedJwtToken' });
    });
  });

  describe('signUp', () => {
    it('should return access_token on successful signup', async () => {
      const signUpInput = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockCreatedUser = {
        ...mockUser,
        password: 'hashedPassword',
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockCreatedUser);

      const result = await service.signUp(signUpInput);

      expect(result).toEqual({ access_token: 'mockedJwtToken' });
    });
  });

  // Additional tests for signUp, updateUser, etc.
});
