import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './auth.model';

@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('users')
  async getAllUsers(): Promise<User[]> {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.authService.getUserById(id);
  }

  @Get('users/email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.authService.getUserByEmail(email);
  }

  @Get('users/username/:username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<User | null> {
    return this.authService.getUserByUsername(username);
  }

  @Post('user')
  async createUser(@Body() data: User): Promise<User> {
    return this.authService.createUser(data);
  }

  @Put('user/:id')
  async updateUser(@Param('id') id: string, @Body() data: User): Promise<User> {
    return this.authService.updateUser(id, data);
  }

  @Delete('user/:id')
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.authService.deleteUser(id);
  }
}
