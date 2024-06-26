import { PrismaService } from 'src/prisma.service';
import { User } from './auth.model';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
      where: {
        id: String(id),
        password: await this.hashPassword(data.password),
      },
      data: { ...data },
    });
  }

  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id: String(id) },
    });
  }
}
