import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './auth.model';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: String(id) } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRound = 10;
    return await bcrypt.hash(password, saltRound);
  }

  async createUser(data: User): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        password: await this.hashPassword(data.password),
      },
    });
  }

  async updateUser(id: string, data: User): Promise<User> {
    return this.prisma.user.update({
      where: { id: String(id) },
      data: {
        ...data,
        password: await this.hashPassword(data.password),
      },
    });
  }

  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id: String(id) },
    });
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
          accessToken,
          refreshToken,
        },
      });
    }

    console.log('existingUser', existingUser);

    return existingUser;
  }
}
