import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating JWT token for subject: ${payload.sub}`);
    
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        this.logger.warn(`JWT validation failed: User ${payload.sub} not found`);
        throw new UnauthorizedException('Invalid token');
      }

      // Check if the auth method still exists
      const authMethod = await this.prisma.authMethod.findUnique({
        where: { id: payload.authMethodId },
      });

      if (!authMethod) {
        this.logger.warn(`JWT validation failed: Auth method ${payload.authMethodId} not found`);
        throw new UnauthorizedException('Invalid token');
      }
      
      if (authMethod.userId !== user.id) {
        this.logger.warn(`JWT validation failed: Auth method belongs to different user`);
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.debug(`JWT token validated successfully for user: ${user.username}`);
      
      // Return user data to be added to request
      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        authMethodId: payload.authMethodId,
        authType: payload.type,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating JWT token: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}