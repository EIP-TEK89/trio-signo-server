import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
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
import { LoginDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Response } from 'express';

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
  async getUserById(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = await this.authService.getUserById(id);
      return res.status(200).send(user);
    } catch (error) {
      return res.status(404).send({ message: error.message });
    }
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
  async getUserByEmail(@Param('email') email: string, @Res() res: Response) {
    try {
      const user = await this.authService.getUserByEmail(email);
      return res.status(200).send(user);
    } catch (error) {
      return res.status(404).send({ message: error.message });
    }
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
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.getUserByUsername(username);
      return res.status(200).send(user);
    } catch (error) {
      return res.status(404).send({ message: error.message });
    }
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Create an account' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error creating user',
  })
  @ApiBody({ type: SignUpDto })
  async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
    try {
      const user = await this.authService.signUp(signUpDto);
      return res.status(201).send(user);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  }

  @Post('log-in')
  @ApiOperation({ summary: 'Log in with an email and a password' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        message: 'Invalid credentials',
      },
    },
  })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      const response = await this.authService.login(user);

      return res.status(200).send(response);
    } catch (error) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    schema: {
      example: {
        access_token: 'newJwtToken',
        refresh_token: 'newRefreshToken',
      },
    },
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Res() res: Response,
  ) {
    try {
      const newTokens = await this.authService.refreshTokens(refreshToken);
      return res.status(200).send(newTokens);
    } catch (error) {
      return res.status(401).send({ message: 'Invalid refresh token' });
    }
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
        password: 'hashedPassword',
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
  async updateUser(
    @Param('id') id: string,
    @Body() data: User,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.updateUser(id, data);
      return res.status(200).send(user);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).send({ message: error.message });
      } else {
        return res.status(400).send({ message: error.message });
      }
    }
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
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = await this.authService.deleteUser(id);
      return res.status(200).send(user);
    } catch (error) {
      return res.status(404).send({ message: error.message });
    }
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
    status: 302,
    description: 'Redirection to frontend with JWT token in URL.',
    headers: {
      Location: {
        description: 'URL of the redirection with the token',
        schema: {
          type: 'string',
          example: 'http://localhost:4000/?token=someJwtToken',
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
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { token } = req.user;

    // Google redirect after successful authentication
    res.redirect(`http://localhost:4000/login?token=${token}`);
  }
}
