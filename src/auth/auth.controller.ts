import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { User } from './auth.model';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully.',
    schema: {
      type: 'array',
      items: {
        $ref: getSchemaPath(User),
      },
      example: [
        {
          id: 'ckp1z7z9d0000z3l7z9d0000z',
          email: 'user1@example.com',
          username: 'user1',
        },
        {
          id: 'ckp1z7z9d0000z3l7z9d0000z',
          email: 'user2@example.com',
          username: 'user2',
        },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getAllUsers(): Promise<User[]> {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'username123',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.authService.getUserById(id);
  }

  @Get('users/email/:email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve a user by email' })
  @ApiParam({ name: 'email', description: 'Email of the user to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'username123',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getUserByEmail(@Param('email') email: string): Promise<User | null> {
    return this.authService.getUserByEmail(email);
  }

  @Get('users/username/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve a user by username' })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'username123',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<User | null> {
    return this.authService.getUserByUsername(username);
  }

  @Post('user')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ description: 'Data for the new user', type: User })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'username123',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid data.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async createUser(@Body() data: User): Promise<User> {
    return this.authService.createUser(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion avec email et mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    schema: {
      example: {
        message: 'Invalid credentials',
      },
    },
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Put('user/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'ID of the user to update' })
  @ApiBody({ description: 'Updated data for the user', type: User })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'updatedUsername123',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid data.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async updateUser(@Param('id') id: string, @Body() data: User): Promise<User> {
    return this.authService.updateUser(id, data);
  }

  @Delete('user/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'ID of the user to delete' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
    schema: {
      example: {
        id: 'ckp1z7z9d0000z3l7z9d0000z',
        email: 'user@example.com',
        username: 'deletedUsername123',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.authService.deleteUser(id);
  }

  // Google OAuth2.0
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Authenticate with Google' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth2 login page.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during authentication process.',
  })
  async googleAuth() {
    // Auth process handled by Passport
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google authentication redirect' })
  @ApiResponse({
    status: 200,
    description:
      'Authentication successful. Returns the user details and tokens.',
    schema: {
      example: {
        message: 'Authentication successful',
        user: {
          id: 'ckp1z7z9d0000z3l7z9d0000z',
          email: 'user@example.com',
          username: 'username123',
          accessToken: 'someAccessToken',
          refreshToken: 'someRefreshToken',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Failed to authenticate with Google.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during authentication callback.',
  })
  googleAuthRedirect(@Req() req) {
    // Google redirect after successful authentication
    return {
      message: 'Authentication successful',
      user: req.user,
    };
  }
}
