import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

jest.mock('../functions/hashPassword.function', () => ({
  hashPassword: jest.fn(),
}));

import { hashPassword } from '../functions/hashPassword.function';
import { NotFoundException } from '@nestjs/common';

class User {
  id: string;
  email: string;
  username: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

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
              update: jest.fn(),
              delete: jest.fn(),
            },
            token: {
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

    it('should throw an error if credentials are invalid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.validateUser('invalid@test.com', 'password'),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('login', () => {
    it('should return access_token on successful login', async () => {
      const result = await service.login(mockUser);
      expect(result).toEqual({
        access_token: 'mockedJwtToken',
        refresh_token: 'mockedJwtToken',
      });
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

      expect(result).toEqual({
        access_token: 'mockedJwtToken',
        refresh_token: 'mockedJwtToken',
      });
    });

    it('should throw an error if the user already exists', async () => {
      const signUpInput = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.signUp(signUpInput)).rejects.toThrow(
        'User already exists',
      );
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

    it('should throw NotFoundException if no user is found by ID', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById('999')).rejects.toThrow(
        NotFoundException,
      );
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

    it('should throw NotFoundException if no user is found by email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserByEmail('notfound@test.com')).rejects.toThrow(
        NotFoundException,
      );
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

    it('should throw NotFoundException if no user is found by username', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserByUsername('notfounduser')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update the user and hash the password', async () => {
      const mockUpdatedUser: User & { createdAt: Date; updatedAt: Date } = {
        id: '1',
        email: 'updated@test.com',
        password: 'hashedUpdatedPassword',
        username: 'updateduser',
        accessToken: 'updatedAccessToken',
        refreshToken: 'updatedRefreshToken',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedData = {
        email: 'updated@test.com',
        password: 'updatedPassword',
        username: 'updateduser',
        accessToken: 'updatedAccessToken',
        refreshToken: 'updatedRefreshToken',
      };

      (hashPassword as jest.Mock).mockResolvedValue('hashedUpdatedPassword');

      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUser('1', updatedData as User);

      expect(result).toEqual(mockUpdatedUser);

      expect(hashPassword).toHaveBeenCalledWith('updatedPassword');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updatedData,
          password: 'hashedUpdatedPassword',
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and return the deleted user data', async () => {
      const mockDeletedUser: User & { createdAt: Date; updatedAt: Date } = {
        id: '1',
        email: 'deleted@test.com',
        password: 'hashedPassword',
        username: 'deleteduser',
        accessToken: 'deletedAccessToken',
        refreshToken: 'deletedRefreshToken',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'delete').mockResolvedValue(mockDeletedUser);

      const result = await service.deleteUser('1');

      expect(result).toEqual(mockDeletedUser);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle cases where the user is not found', async () => {
      jest
        .spyOn(prisma.user, 'delete')
        .mockRejectedValue(new Error('User not found'));

      await expect(service.deleteUser('nonexistent-id')).rejects.toThrow(
        'User not found',
      );

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
    });
  });

  describe('validateOAuthLogin', () => {
    const mockUser: User & { createdAt: Date; updatedAt: Date } = {
      id: '1',
      email: 'oauthuser@test.com',
      password: 'hashedPassword',
      username: 'oauthuser',
      accessToken: 'oauthAccessToken',
      refreshToken: 'oauthRefreshToken',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUser = {
      email: 'oauthuser@test.com',
      username: 'oauthuser',
      accessToken: 'oauthAccessToken',
      refreshToken: 'oauthRefreshToken',
    };

    it('should return the existing user if found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.validateOAuthLogin(newUser as User);

      expect(result).toEqual(mockUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'oauthuser@test.com' },
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create and return a new user if not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.validateOAuthLogin(newUser as User);

      expect(result).toEqual(mockUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'oauthuser@test.com' },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauthuser@test.com',
          username: 'oauthuser',
        },
      });
    });
  });

  // Additional tests for signUp, updateUser, etc.
});
