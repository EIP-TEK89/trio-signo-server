import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
// import { User } from '../auth.model';

const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // On mock le service Prisma
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: '1', email: 'test@example.com', username: 'testuser' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await authService.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserById('1');
      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent');
      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
      });
    });
  });

  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
  }));

  describe('createUser', () => {
    it('should create and return a user', async () => {
      const mockUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await authService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      });

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    });
  });

  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('updatedPassword'),
  }));

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'updateduser',
        password: 'updatedPassword',
      };

      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await authService.updateUser('1', {
        email: 'test@example.com',
        username: 'updateduser',
        password: 'newpassword',
      });

      expect(result).toEqual(mockUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          email: 'test@example.com',
          username: 'updateduser',
          password: 'updatedPassword',
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await authService.deleteUser('1');
      expect(result).toEqual(mockUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
