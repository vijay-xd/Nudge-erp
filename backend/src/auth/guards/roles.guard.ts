import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuthenticatedUser } from '../../common/interfaces/auth-user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user }: { user?: AuthenticatedUser } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: No role assigned to user');
    }

    // ORG_ADMIN has superuser privileges across all organization actions
    if (user.role === UserRole.ORG_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Requires one of [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
