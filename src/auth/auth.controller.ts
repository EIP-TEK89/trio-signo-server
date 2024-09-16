import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { User } from './auth.model';

@ApiTags('auth')
@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('users')
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully.',
  })
  async getAllUsers(): Promise<User[]> {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.authService.getUserById(id);
  }

  @Get('users/email/:email')
  @ApiOperation({ summary: 'Retrieve a user by email' })
  @ApiParam({ name: 'email', description: 'Email of the user to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.authService.getUserByEmail(email);
  }

  @Get('users/username/:username')
  @ApiOperation({ summary: 'Retrieve a user by username' })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<User | null> {
    return this.authService.getUserByUsername(username);
  }

  @Post('user')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ description: 'Data for the new user', type: User })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async createUser(@Body() data: User): Promise<User> {
    return this.authService.createUser(data);
  }

  @Put('user/:id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'ID of the user to update' })
  @ApiBody({ description: 'Updated data for the user', type: User })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(@Param('id') id: string, @Body() data: User): Promise<User> {
    return this.authService.updateUser(id, data);
  }

  @Delete('user/:id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'ID of the user to delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.authService.deleteUser(id);
  }
}
