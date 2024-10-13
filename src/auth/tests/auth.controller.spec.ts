import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
// import { JwtAuthGuard } from '../jwt-auth.guard';
import { User } from '../auth.model';
import { SignUpDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: User = {
    id: '1',
    email: 'user@example.com',
    username: 'user1',
    password: 'hashedPassword',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getAllUsers: jest.fn().mockResolvedValue([mockUser]),
            getUserById: jest.fn().mockResolvedValue(mockUser),
            getUserByEmail: jest.fn().mockResolvedValue(mockUser),
            getUserByUsername: jest.fn().mockResolvedValue(mockUser),
            signUp: jest
              .fn()
              .mockResolvedValue({ access_token: 'mockedJwtToken' }),
            login: jest
              .fn()
              .mockResolvedValue({ access_token: 'mockedJwtToken' }),
            updateUser: jest.fn().mockResolvedValue(mockUser),
            deleteUser: jest.fn().mockResolvedValue(mockUser),
            validateUser: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const result = await controller.getAllUsers();
      expect(result).toEqual([mockUser]);
      expect(service.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const result = await controller.getUserById('1');
      expect(result).toEqual(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith('1');
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const result = await controller.getUserByEmail('user@example.com');
      expect(result).toEqual(mockUser);
      expect(service.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user by username', async () => {
      const result = await controller.getUserByUsername('user1');
      expect(result).toEqual(mockUser);
      expect(service.getUserByUsername).toHaveBeenCalledWith('user1');
    });
  });

  describe('signUp', () => {
    it('should create a new user and return access_token', async () => {
      const dto: SignUpDto = {
        email: 'user@example.com',
        password: '123456',
        username: 'user1',
      };
      const result = await controller.signUp(dto);
      expect(result).toEqual({ access_token: 'mockedJwtToken' });
      expect(service.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should log in a user and return access_token', async () => {
      const dto: LoginDto = { email: 'user@example.com', password: '123456' };
      const result = await controller.login(dto);
      expect(result).toEqual({ access_token: 'mockedJwtToken' });
      expect(service.login).toHaveBeenCalled();
    });

    it('should return "Invalid credentials" if the user is not found', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      const dto: LoginDto = {
        email: 'wronguser@example.com',
        password: 'wrongpassword',
      };
      const result = await controller.login(dto);
      expect(result).toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const result = await controller.updateUser('1', mockUser);
      expect(result).toEqual(mockUser);
      expect(service.updateUser).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const result = await controller.deleteUser('1');
      expect(result).toEqual(mockUser);
      expect(service.deleteUser).toHaveBeenCalledWith('1');
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to Google OAuth with the token', async () => {
      const req = {
        user: { token: 'mockedJwtToken' },
      } as any;

      const res = {
        redirect: jest.fn(),
      } as any;

      controller.googleAuthRedirect(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:4000/login?token=mockedJwtToken',
      );
    });
  });
});
