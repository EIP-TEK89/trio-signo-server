import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, ParseIntPipe, DefaultValuePipe, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { PaginatedUsersEntity } from './entities/paginated-users.entity';
import { IUser, PaginatedUsers, IUserQueryOptions } from './interfaces/user.interface';

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The user has been successfully created.',
    type: User
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'User with that username or email already exists.' 
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<IUser> {
    this.logger.log(`Creating new user with username: ${createUserDto.username}`);
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'skip', required: false, description: 'Number of records to skip', type: Number })
  @ApiQuery({ name: 'take', required: false, description: 'Number of records to take', type: Number })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Field to order by (e.g. "username:asc")', type: String })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter users by name, username or email', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return paginated list of users',
    type: PaginatedUsersEntity
  })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take?: number,
    @Query('orderBy') orderByString?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedUsers> {
    this.logger.log(`Finding all users with pagination: skip=${skip}, take=${take}`);
    if (search) {
      this.logger.log(`Search term: ${search}`);
    }
    if (orderByString) {
      this.logger.log(`Order by: ${orderByString}`);
    }
    
    // Convert REST API query params to our interface options
    const options: IUserQueryOptions = {
      skip,
      take,
      searchTerm: search
    };
    
    // Parse order by string (field:direction) to our interface format
    if (orderByString) {
      const [field, direction] = orderByString.split(':');
      if (field && ['id', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'].includes(field)) {
        options.orderBy = {
          field: field as keyof IUser,
          direction: direction === 'desc' ? 'desc' : 'asc'
        };
      } else {
        this.logger.warn(`Invalid orderBy field: ${field}`);
      }
    }
    
    return this.userService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return the user',
    type: User
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async findOne(@Param('id') id: string): Promise<IUser> {
    this.logger.log(`Finding user by ID: ${id}`);
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The user has been successfully updated.',
    type: User
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'User with that username or email already exists.' 
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<IUser> {
    this.logger.log(`Updating user with ID: ${id}`);
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The user has been successfully deleted.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async remove(@Param('id') id: string): Promise<IUser> {
    this.logger.log(`Removing user with ID: ${id}`);
    return this.userService.remove(id);
  }
}
