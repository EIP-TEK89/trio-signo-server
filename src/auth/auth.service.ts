import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './auth.model';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { hashPassword } from './functions/hashPassword.function';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { username: user.username, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      const existingToken = await this.prisma.token.findFirst({
        where: {
          refreshToken: refreshToken,
          userId: decoded.sub,
          revoked: false,
        },
      });

      if (!existingToken) {
        throw new Error('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await this.prisma.token.update({
        where: { id: existingToken.id },
        data: { revoked: true },
      });

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user);

      await this.prisma.token.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken: newRefreshToken,
          type: 'JWT',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanUpExpiredTokens() {
    const deleted = await this.prisma.token.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
        revoked: false,
      },
    });
    console.log(`Deleted ${deleted.count} expired tokens`);
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    throw new Error('Invalid email or password');
  }

  async login(user: User) {
    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.prisma.token.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        type: 'JWT',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days of validity
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async signUp(data: { email: string; username: string; password: string }) {
    const hashedPassword = await hashPassword(data.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.prisma.token.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        type: 'JWT',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours de validité
        revoked: false,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: User): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    } else if (!data.password || !data.username || !data.email) {
      throw new Error('Bad request. Invalid data');
    }

    return this.prisma.user.update({
      where: { id: String(id) },
      data: {
        ...data,
        password: await hashPassword(data.password),
      },
    });
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: String(id) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({ where: { id: String(id) } });
  }

  async validateOAuthLogin(user: User): Promise<User> {
    const { email, username, accessToken, refreshToken } = user;

    let existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      existingUser = await this.prisma.user.create({
        data: {
          email,
          username,
        },
      });
    }

    await this.prisma.token.create({
      data: {
        userId: existingUser.id,
        token: accessToken,
        refreshToken: refreshToken, // refresh of the OAuth token
        type: 'OAUTH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days of validity
        revoked: false,
      },
    });

    return existingUser;
  }
}
