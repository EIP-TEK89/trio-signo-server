import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from '../google.strategy';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateOAuthLogin: jest.fn().mockResolvedValue({
              username: 'testuser',
              id: '1',
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockedJwtToken'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mockedValue'),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should validate user from Google and return JWT token', async () => {
    const profile = {
      name: { givenName: 'Test', familyName: 'User' },
      emails: [{ value: 'test@test.com' }],
    };
    const done = jest.fn();

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      email: 'test@test.com',
      username: 'TestUser',
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });

    expect(done).toHaveBeenCalledWith(null, {
      user: { username: 'testuser', id: '1' },
      token: 'mockedJwtToken',
    });
  });
});
