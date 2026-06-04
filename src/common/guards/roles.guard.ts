import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

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

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext<{ req: { user?: { roles?: UserRole[]; email?: string } } }>().req;
    const userRoles = request.user?.roles ?? [];
    const isAllowed = requiredRoles.some((role) => userRoles.includes(role));

    if (!isAllowed) {
      throw new ForbiddenException('You do not have permission to perform this GraphQL operation');
    }

    return true;
  }
}
