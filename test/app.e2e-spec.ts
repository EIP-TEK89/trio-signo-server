import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/auth/auth.model';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;
  let token: string;

  const mockUser: User = {
    id: '1',
    email: 'user@example.com',
    username: 'user1',
    password: 'hashedPassword',
    accessToken: '',
    refreshToken: '',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authService = moduleFixture.get<AuthService>(AuthService);

    token = jwtService.sign({ username: mockUser.username, sub: mockUser.id });
  });

  it('/api/auth/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
