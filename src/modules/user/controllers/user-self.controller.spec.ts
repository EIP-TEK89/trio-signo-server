import { Test, TestingModule } from '@nestjs/testing';
import { UserSelfController } from './user-self.controller';
import { UserService } from '../user.service';
import { NotFoundException, Logger } from '@nestjs/common';
import { UserRole } from '../interfaces/user.interface';

describe('UserSelfController', () => {
  let controller: UserSelfController;
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
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Mock request with authenticated user
  const mockRequest = {
    user: {
      userId: 'user-id-1',
      username: 'testuser',
      role: UserRole.USER,
    },
  };

  // Mock request with admin user
  const mockAdminRequest = {
    user: {
      userId: 'admin-id-1',
      username: 'adminuser',
      role: UserRole.ADMIN,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSelfController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserSelfController>(UserSelfController);
    userService = module.get<UserService>(UserService);
        
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return the current user profile', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockRequest);

      expect(userService.findOne).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUser);
    });

    it('should pass through service exceptions', async () => {
      mockUserService.findOne.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.getCurrentUser(mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update the current user profile', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
      };
      
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateCurrentUser(mockRequest, updateUserDto);

      expect(userService.update).toHaveBeenCalledWith('user-id-1', updateUserDto);
      expect(result).toHaveProperty('firstName', 'Updated');
      expect(result).toHaveProperty('lastName', 'Name');
    });

    it('should remove role from update data for non-admin users', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        role: UserRole.ADMIN, // Attempting to escalate privileges
      };
      
      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
        // Role should remain unchanged
      };
      
      mockUserService.update.mockResolvedValue(updatedUser);

      await controller.updateCurrentUser(mockRequest, updateUserDto);

      // Check that role was removed from the update data
      expect(userService.update).toHaveBeenCalledWith('user-id-1', {
        firstName: 'Updated',
        lastName: 'Name',
        // No role here
      });
    });

    it('should allow role updates for admin users', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        role: UserRole.MODERATOR, // Admins can change roles
      };
      
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
      };
      
      mockUserService.update.mockResolvedValue(updatedUser);

      await controller.updateCurrentUser(mockAdminRequest, updateUserDto);

      // Role should be included in the update
      expect(userService.update).toHaveBeenCalledWith('admin-id-1', updateUserDto);
    });

    it('should pass through service exceptions', async () => {
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.updateCurrentUser(mockRequest, { firstName: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeCurrentUser', () => {
    it('should delete the current user account', async () => {
      mockUserService.remove.mockResolvedValue(mockUser);

      const result = await controller.removeCurrentUser(mockRequest);

      expect(userService.remove).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUser);
    });

    it('should pass through service exceptions', async () => {
      mockUserService.remove.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.removeCurrentUser(mockRequest)).rejects.toThrow(NotFoundException);
    });
  });
});