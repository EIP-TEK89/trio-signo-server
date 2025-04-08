import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    
    this.logger.debug(`Auth check for ${method} ${url}`);
    
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug(`Skipping auth check for public route: ${method} ${url}`);
      return true;
    }

    this.logger.debug(`Performing JWT authentication for protected route: ${method} ${url}`);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err) {
      this.logger.warn(`JWT authentication error: ${err.message}`);
      throw err;
    }
    
    if (!user) {
      this.logger.warn('JWT authentication failed: No user found in token payload');
      throw new UnauthorizedException('Authentication required');
    }
    
    this.logger.debug(`JWT authentication successful for user: ${user.username || user.userId}`);
    return user;
  }
}