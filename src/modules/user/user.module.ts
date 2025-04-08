import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controllers/user.controller';
import { UserSelfController } from './controllers/user-self.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [UserSelfController, UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
