import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Prisma, AuthMethodType } from '@prisma/client';
import { hashPassword, comparePasswords } from '../auth/utils/password.util';
import {
  IUser,
  PaginatedUsers,
  ICreateUserData,
  IUpdateUserData,
  IUserQueryOptions,
} from './interfaces/user.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user with basic profile information
   * Note: This does not handle authentication methods - that's the auth module's responsibility
   */
  async create(createUserDto: CreateUserDto): Promise<IUser> {
    this.logger.log(
      `Creating user with username: ${createUserDto.username}, email: ${createUserDto.email}`,
    );

    try {
      const userData: ICreateUserData = {
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl,
      };

      this.logger.debug(`Creating user with data: ${JSON.stringify(userData)}`);
      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        },
      });

      this.logger.log(`User created successfully with ID: ${user.id}`);
      return user as IUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target as string[];
          const errorMsg = `User with this ${field.join(', ')} already exists`;
          this.logger.warn(`Creation failed: ${errorMsg}`);
          throw new ConflictException(errorMsg);
        }
      }
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all users with pagination support
   */
  async findAll(options: IUserQueryOptions): Promise<PaginatedUsers> {
    const { skip = 0, take = 10, searchTerm } = options;

    this.logger.log(
      `Finding users with pagination: skip=${skip}, take=${take}`,
    );
    if (searchTerm) {
      this.logger.debug(`Searching for term: ${searchTerm}`);
    }

    // Convert our interface-based query options to Prisma query options
    let orderBy = undefined;
    if (options.orderBy) {
      orderBy = {
        [options.orderBy.field]: options.orderBy.direction,
      };
      this.logger.debug(
        `Ordering by: ${options.orderBy.field} ${options.orderBy.direction}`,
      );
    }

    // Build the where clause for search functionality
    let where = undefined;
    if (searchTerm) {
      where = {
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take,
          orderBy,
          where,
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            role: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const page = Math.floor(skip / take) + 1;
      this.logger.log(
        `Found ${users.length} users (total: ${total}, page ${page})`,
      );

      return {
        data: users as IUser[],
        meta: {
          total,
          page,
          take,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * Includes basic profile info only, not auth methods
   */
  async findOne(id: string): Promise<IUser> {
    this.logger.log(`Finding user by ID: ${id}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        },
      });

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.debug(`Found user: ${user.username}`);
      return user as IUser;
    } catch (error) {
      // Don't log NotFoundExceptions as errors since they're expected in some flows
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Error finding user with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<IUser | null> {
    this.logger.log(`Finding user by email: ${email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        },
      });

      if (user) {
        this.logger.debug(`Found user by email: ${user.username}`);
      } else {
        this.logger.debug(`No user found with email: ${email}`);
      }

      return user as IUser | null;
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    this.logger.log(`Finding user by username: ${username}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        },
      });

      if (user) {
        this.logger.debug(`Found user by username: ${username}`);
      } else {
        this.logger.debug(`No user found with username: ${username}`);
      }

      return user as IUser | null;
    } catch (error) {
      this.logger.error(
        `Error finding user by username: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a user's profile information
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    this.logger.log(`Updating user with ID: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateUserDto)}`);

    try {
      // First verify the user exists
      await this.findOne(id);

      const updateData: IUpdateUserData = {
        username: updateUserDto.username,
        email: updateUserDto.email,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        avatarUrl: updateUserDto.avatarUrl,
      };

      // Filter out undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      this.logger.debug(`Processed update data: ${JSON.stringify(updateData)}`);

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        },
      });

      this.logger.log(`User ${id} updated successfully`);
      return user as IUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target as string[];
          const errorMsg = `User with this ${field.join(', ')} already exists`;
          this.logger.warn(`Update failed: ${errorMsg}`);
          throw new ConflictException(errorMsg);
        }
      }
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to update user ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Delete a user and all associated data
   * This method manually deletes related records first to avoid foreign key constraint errors
   * Requires password verification for security if password is provided
   * Admin can bypass password verification for admin operations
   */
  async remove(id: string, password?: string): Promise<IUser> {
    this.logger.log(`Removing user with ID: ${id}`);

    try {
      // First verify the user exists
      const user = await this.findOne(id);

      // If password is provided, verify it before proceeding with deletion
      if (password) {
        // Get the LOCAL auth method for this user
        const authMethod = await this.prisma.authMethod.findFirst({
          where: {
            userId: id,
            type: AuthMethodType.LOCAL,
          },
        });

        if (!authMethod) {
          this.logger.warn(`No LOCAL auth method found for user ${id}`);
          throw new BadRequestException(
            'Cannot delete account: no local authentication method found',
          );
        }

        // Verify the password
        const isPasswordValid = await comparePasswords(
          password,
          authMethod.credential,
        );

        if (!isPasswordValid) {
          this.logger.warn(
            `Invalid password provided for account deletion: user ${id}`,
          );
          throw new UnauthorizedException(
            'Password is incorrect. Account deletion aborted.',
          );
        }

        this.logger.debug(
          `Password verified for user ${id}, proceeding with deletion`,
        );
      } else {
        this.logger.debug(
          `Password verification bypassed for user ${id} (admin operation)`,
        );
      }

      // Begin a transaction to ensure all operations succeed or fail together
      return await this.prisma.$transaction(async (prisma) => {
        // Delete related LessonProgress records first
        this.logger.debug(`Deleting LessonProgress records for user ${id}`);
        await prisma.lessonProgress.deleteMany({
          where: { userId: id },
        });

        // If you have other related records to delete, add them here

        // Finally delete the user
        const deletedUser = await prisma.user.delete({
          where: { id },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            role: true,
          },
        });

        this.logger.log(
          `User ${id} (${deletedUser.username}) successfully deleted`,
        );
        return deletedUser as IUser;
      });
    } catch (error) {
      if (
        !(error instanceof NotFoundException) &&
        !(error instanceof UnauthorizedException) &&
        !(error instanceof BadRequestException)
      ) {
        this.logger.error(
          `Failed to delete user ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Change a user's password
   * This method verifies the current password before allowing the change
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    this.logger.log(`Changing password for user ID: ${userId}`);

    try {
      // First verify the user exists
      const user = await this.findOne(userId);

      // Get the LOCAL auth method for this user
      const authMethod = await this.prisma.authMethod.findFirst({
        where: {
          userId: userId,
          type: AuthMethodType.LOCAL,
        },
      });

      if (!authMethod) {
        this.logger.warn(`No LOCAL auth method found for user ${userId}`);
        throw new BadRequestException(
          'Cannot change password: no local authentication method found',
        );
      }

      // Verify the current password
      const isPasswordValid = await comparePasswords(
        changePasswordDto.currentPassword,
        authMethod.credential,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Invalid current password provided for user ${userId}`,
        );
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash the new password
      const hashedNewPassword = await hashPassword(
        changePasswordDto.newPassword,
      );

      // Update the credential
      await this.prisma.authMethod.update({
        where: { id: authMethod.id },
        data: {
          credential: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Password successfully changed for user ${userId}`);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to change password for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
