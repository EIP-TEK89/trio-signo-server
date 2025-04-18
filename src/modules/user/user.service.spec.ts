import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { UserRole } from './interfaces/user.interface';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../prisma/prisma.service';

const mockUser = {
  id: 'user-id-1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: new Date(),
  updatedAt: new Date(),
  role: UserRole.USER,
};

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;
  
  // Mock Logger class to prevent noisy console output during tests
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
        
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        avatarUrl: 'https://example.com/new-avatar.png',
      };

      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: UserRole.USER,
      });

      const result = await service.create(createUserDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
        select: expect.objectContaining({
          id: true,
          username: true,
          email: true,
        }),
      });
      expect(result).toHaveProperty('id', 'new-user-id');
      expect(result).toHaveProperty('username', createUserDto.username);
      expect(result).toHaveProperty('email', createUserDto.email);
    });

    it('should throw ConflictException when username/email is already taken', async () => {
      const createUserDto = {
        username: 'existinguser',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
      };

      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '2.0.0',
        meta: { target: ['email'] },
      });

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('User with this email already exists');
    });

    it('should propagate unknown errors', async () => {
      const createUserDto = {
        username: 'erroruser',
        email: 'error@example.com',
        firstName: 'Error',
        lastName: 'User',
      };

      const unknownError = new Error('Unknown database error');
      mockPrismaService.user.create.mockRejectedValue(unknownError);

      await expect(service.create(createUserDto)).rejects.toThrow('Unknown database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-id-2', username: 'user2', email: 'user2@example.com' }];
      const total = 2;
      
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(total);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        take: 10,
      });
    });

    it('should apply search filters correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll({ skip: 0, take: 10, searchTerm: 'test' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          OR: [
            { username: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { firstName: { contains: 'test', mode: 'insensitive' } },
            { lastName: { contains: 'test', mode: 'insensitive' } },
          ]
        }
      }));
    });

    it('should order results correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll({ 
        skip: 0, 
        take: 10, 
        orderBy: { field: 'username', direction: 'desc' } 
      });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { username: 'desc' }
      }));
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findMany.mockRejectedValue(dbError);

      await expect(service.findAll({ skip: 0, take: 10 })).rejects.toThrow('Database connection failed');
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-id-1');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: expect.objectContaining({
          id: true,
          username: true,
          email: true,
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow('User with ID nonexistent-id not found');
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return a user when found by username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found by username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      // Mock the findOne to verify user exists
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock the update operation
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
        updatedAt: new Date(),
      });

      const result = await service.update('user-id-1', updateUserDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: updateUserDto,
        select: expect.any(Object),
      });
      expect(result).toHaveProperty('firstName', 'Updated');
      expect(result).toHaveProperty('lastName', 'Name');
    });

    it('should filter out undefined values from update data', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: undefined,
        email: undefined,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
        updatedAt: new Date(),
      });

      await service.update('user-id-1', updateUserDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { firstName: 'Updated' }
        })
      );
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { firstName: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when unique constraint is violated', async () => {
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '2.0.0',
        meta: { target: ['username'] },
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.update('user-id-1', { username: 'taken' })).rejects.toThrow(ConflictException);
      await expect(service.update('user-id-1', { username: 'taken' })).rejects.toThrow('User with this username already exists');
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('user-id-1');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});