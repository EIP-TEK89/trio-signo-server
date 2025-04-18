import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../user.service';
import { NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { UserRole } from '../interfaces/user.interface';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  
  // Mock Logger class to prevent noisy console output during tests
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

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

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
        
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        avatarUrl: 'https://example.com/new-avatar.png',
        role: UserRole.USER
      };
      
      mockUserService.create.mockResolvedValue({
        id: 'new-user-id',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.create(createUserDto);

      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toHaveProperty('id', 'new-user-id');
      expect(result).toHaveProperty('username', createUserDto.username);
    });

    it('should pass through service exceptions', async () => {
      const createUserDto = {
        username: 'existinguser',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.USER
      };
      
      mockUserService.create.mockRejectedValue(
        new ConflictException('User with this username already exists')
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedUsers = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          take: 10,
        },
      };
      
      mockUserService.findAll.mockResolvedValue(paginatedUsers);

      const result = await controller.findAll(0, 10);

      expect(userService.findAll).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
      expect(result).toEqual(paginatedUsers);
    });

    it('should handle search and ordering parameters', async () => {
      const paginatedUsers = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          take: 10,
        },
      };
      
      mockUserService.findAll.mockResolvedValue(paginatedUsers);

      await controller.findAll(0, 10, 'username:asc', 'test');

      expect(userService.findAll).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        searchTerm: 'test',
        orderBy: {
          field: 'username',
          direction: 'asc',
        },
      }));
    });

    it('should handle invalid orderBy field', async () => {
      const paginatedUsers = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          take: 10,
        },
      };
      
      mockUserService.findAll.mockResolvedValue(paginatedUsers);

      await controller.findAll(0, 10, 'invalidField:asc');

      // Should not include the orderBy field in options
      expect(userService.findAll).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
      expect(userService.findAll).not.toHaveBeenCalledWith(expect.objectContaining({
        orderBy: expect.anything(),
      }));
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-id-1');

      expect(userService.findOne).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUser);
    });

    it('should pass through NotFoundException', async () => {
      mockUserService.findOne.mockRejectedValue(
        new NotFoundException('User with ID nonexistent-id not found')
      );

      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
      };
      
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-id-1', updateUserDto);

      expect(userService.update).toHaveBeenCalledWith('user-id-1', updateUserDto);
      expect(result).toHaveProperty('firstName', 'Updated');
      expect(result).toHaveProperty('lastName', 'Name');
    });

    it('should pass through service exceptions', async () => {
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User with ID nonexistent-id not found')
      );

      await expect(controller.update('nonexistent-id', { firstName: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockUserService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-id-1');

      expect(userService.remove).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUser);
    });

    it('should pass through service exceptions', async () => {
      mockUserService.remove.mockRejectedValue(
        new NotFoundException('User with ID nonexistent-id not found')
      );

      await expect(controller.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});