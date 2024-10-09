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
              findMany: jest.fn(),
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

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          password: 'hashedPassword1',
          username: 'user1',
          accessToken: 'accessToken1',
          refreshToken: 'refreshToken1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'user2@test.com',
          password: 'hashedPassword2',
          username: 'user2',
          accessToken: 'accessToken2',
          refreshToken: 'refreshToken2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return a user when found by ID', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserById('1');
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if no user is found by ID', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserById('999');
      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '999' },
      });
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user when found by email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('should return null if no user is found by email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserByEmail('notfound@test.com');
      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'notfound@test.com' },
      });
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user when found by username', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserByUsername('testuser');
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null if no user is found by username', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserByUsername('notfounduser');
      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'notfounduser' },
      });
    });
  });

  // Additional tests for signUp, updateUser, etc.
});
