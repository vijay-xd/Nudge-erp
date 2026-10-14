import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/interfaces/auth-user.interface.js';

export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Organization context not found in request token');
    }
    return user.organizationId;
  },
);
