import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../user/interfaces/user.interface';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, deny access (this shouldn't happen if JwtAuthGuard is applied first)
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      return false;
    }

    try {
      // Get the current user with role from the database
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: true },
      });

      if (!dbUser) {
        this.logger.warn(`RolesGuard: User with ID ${user.userId} not found in database`);
        return false;
      }

      // Check if the user's role is in the required roles list
      const hasRequiredRole = requiredRoles.includes(dbUser.role as UserRole);
      
      if (!hasRequiredRole) {
        this.logger.warn(`RolesGuard: User ${user.userId} with role ${dbUser.role} is not authorized. Required roles: ${requiredRoles.join(', ')}`);
        throw new ForbiddenException(`Insufficient permissions. Role ${requiredRoles.join(' or ')} required.`);
      }

      this.logger.debug(`RolesGuard: User ${user.userId} with role ${dbUser.role} is authorized`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`RolesGuard: Error checking user role: ${error.message}`, error.stack);
      return false;
    }
  }
}