import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { 
  IUser, 
  PaginatedUsers, 
  ICreateUserData, 
  IUpdateUserData, 
  IUserQueryOptions 
} from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user with basic profile information
   * Note: This does not handle authentication methods - that's the auth module's responsibility
   */
  async create(createUserDto: CreateUserDto): Promise<IUser> {
    try {
      const userData: ICreateUserData = {
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatarUrl: createUserDto.avatarUrl,
      };

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
        }
      });

      return user as IUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target as string[];
          throw new ConflictException(`User with this ${field.join(', ')} already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * Get all users with pagination support
   */
  async findAll(options: IUserQueryOptions): Promise<PaginatedUsers> {
    const { skip = 0, take = 10, searchTerm } = options;
    
    // Convert our interface-based query options to Prisma query options
    let orderBy = undefined;
    if (options.orderBy) {
      orderBy = {
        [options.orderBy.field]: options.orderBy.direction,
      };
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
        ]
      };
    }
    
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
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users as IUser[],
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        take
      }
    };
  }

  /**
   * Find a user by ID
   * Includes basic profile info only, not auth methods
   */
  async findOne(id: string): Promise<IUser> {
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
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as IUser;
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<IUser | null> {
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
      }
    });
    
    return user as IUser | null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
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
      }
    });
    
    return user as IUser | null;
  }

  /**
   * Update a user's profile information
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
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
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
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
        }
      });
      
      return user as IUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target as string[];
          throw new ConflictException(`User with this ${field.join(', ')} already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a user and all associated data
   * Note: Prisma cascade will handle deleting any related records
   */
  async remove(id: string): Promise<IUser> {
    // First verify the user exists
    await this.findOne(id);
    
    const user = await this.prisma.user.delete({
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
      }
    });
    
    return user as IUser;
  }
}
