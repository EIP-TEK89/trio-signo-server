import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
// import { JwtService } from '@nestjs/jwt';
// import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

describe('AuthModule Integration', () => {
  let module: TestingModule;
  let authService: AuthService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('AuthService should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should resolve the AuthController', () => {
    const authController = module.get<AuthController>(AuthController);
    expect(authController).toBeDefined();
  });
});
