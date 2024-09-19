import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, GoogleStrategy],
})
export class AuthModule {}
