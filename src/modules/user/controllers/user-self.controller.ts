import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from '../user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { User } from '../entities/user.entity';
import { IUser, UserRole } from '../interfaces/user.interface';

@ApiTags('User Self-Service')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserSelfController {
  private readonly logger = new Logger(UserSelfController.name);

  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the current user profile',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  async getCurrentUser(@Req() req): Promise<IUser> {
    const userId = req.user.userId;
    this.logger.log(`Getting profile for user ID: ${userId}`);
    return this.userService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user profile has been successfully updated.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with that username or email already exists.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  async updateCurrentUser(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IUser> {
    const userId = req.user.userId;
    this.logger.log(`Updating profile for user ID: ${userId}`);

    // Remove role from updateUserDto if present to prevent regular users from escalating privileges
    if (updateUserDto.role && req.user.role !== UserRole.ADMIN) {
      delete updateUserDto.role;
      this.logger.warn(
        `Removed role from update request for non-admin user: ${userId}`,
      );
    }

    return this.userService.update(userId, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user account has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated or password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or account cannot be deleted',
  })
  async removeCurrentUser(
    @Req() req,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<IUser> {
    const userId = req.user.userId;
    this.logger.log(`Deleting account for user ID: ${userId}`);
    return this.userService.remove(userId, deleteAccountDto.password);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been successfully changed.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid password format or current password is incorrect.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    this.logger.log(`Changing password for user ID: ${userId}`);
    await this.userService.changePassword(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }
}
