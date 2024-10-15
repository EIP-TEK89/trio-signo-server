import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
// import { JwtAuthGuard } from '../jwt-auth.guard';
import { User } from '../auth.model';
import { SignUpDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/log-in.dto';

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

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
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
      const res = mockResponse();
      await controller.getUserById('1', res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith('1');
    });

    it('should return "User not found" if the user is not found', async () => {
      jest
        .spyOn(service, 'getUserById')
        .mockRejectedValue(new Error('User not found'));
      const res = mockResponse();
      await controller.getUserById('1', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const res = mockResponse();
      await controller.getUserByEmail('user@example.com', res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUser);
      expect(service.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should return "User not found" if the user is not found', async () => {
      jest
        .spyOn(service, 'getUserByEmail')
        .mockRejectedValue(new Error('User not found'));
      const res = mockResponse();
      await controller.getUserByEmail('false@exemple.com', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user by username', async () => {
      const res = mockResponse();
      await controller.getUserByUsername('user1', res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUser);
      expect(service.getUserByUsername).toHaveBeenCalledWith('user1');
    });

    it('should return "User not found" if the user is not found', async () => {
      jest
        .spyOn(service, 'getUserByUsername')
        .mockRejectedValue(new Error('User not found'));
      const res = mockResponse();
      await controller.getUserByUsername('falseuser', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('signUp', () => {
    it('should create a new user and return access_token', async () => {
      const dto: SignUpDto = {
        email: 'user@example.com',
        password: '123456',
        username: 'user1',
      };
      const res = mockResponse();
      await controller.signUp(dto, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ access_token: 'mockedJwtToken' });
      expect(service.signUp).toHaveBeenCalledWith(dto);
    });

    it('should return "User already exists" if the user is already registered', async () => {
      jest
        .spyOn(service, 'signUp')
        .mockRejectedValue(new Error('User already exists'));
      const dto: SignUpDto = {
        email: 'user@example.com',
        password: '123456',
        username: 'user1',
      };
      const res = mockResponse();
      await controller.signUp(dto, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'User already exists' });
    });
  });

  describe('login', () => {
    it('should log in a user and return access_token', async () => {
      const dto: LoginDto = { email: 'user@example.com', password: '123456' };
      const res = mockResponse();
      await controller.login(dto, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ access_token: 'mockedJwtToken' });
      expect(service.login).toHaveBeenCalled();
    });

    it('should return "Invalid credentials" if the user is not found', async () => {
      jest
        .spyOn(service, 'validateUser')
        .mockRejectedValue(new Error('Invalid email or password'));
      const dto: LoginDto = {
        email: 'wronguser@example.com',
        password: 'wrongpassword',
      };
      const res = mockResponse();
      await controller.login(dto, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const res = mockResponse();

      await controller.updateUser('1', mockUser, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUser);
      expect(service.updateUser).toHaveBeenCalledWith('1', mockUser);
    });

    it('should return "User not found" if the user is not found', async () => {
      jest
        .spyOn(service, 'updateUser')
        .mockRejectedValue(new Error('User not found'));
      const res = mockResponse();
      await controller.updateUser('1', mockUser, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return "Bad request. Invalid data" if the data is invalid', async () => {
      jest
        .spyOn(service, 'updateUser')
        .mockRejectedValue(new Error('Bad request. Invalid data'));
      const res = mockResponse();
      await controller.updateUser('1', mockUser, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Bad request. Invalid data',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const res = mockResponse();

      await controller.deleteUser('1', res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUser);
      expect(service.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should return "User not found" if the user is not found', async () => {
      jest
        .spyOn(service, 'deleteUser')
        .mockRejectedValue(new Error('User not found'));
      const res = mockResponse();
      await controller.deleteUser('1', res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'User not found' });
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
