import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    systemRole: string;
    tenantId: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  // Hierarchical mapping: Lower index means higher privilege
  private readonly roleHierarchy = [
    SystemRole.SUPER_ADMIN,
    SystemRole.TENANT_ADMIN,
    SystemRole.HR_ADMIN,
    SystemRole.IT_ADMIN,
    SystemRole.EMPLOYEE,
  ];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    let user = request.user;

    // MOCK AUTH: If no user is populated by a global JWT middleware, we extract the mock token here
    if (!user) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer mock-jwt-token-for-')) {
        const userId = authHeader.replace('Bearer mock-jwt-token-for-', '');
        try {
          const dbUser = await this.prisma.user.findUnique({
            where: { id: userId },
          });
          if (dbUser) {
            user = {
              id: dbUser.id,
              systemRole: dbUser.systemRole,
              tenantId: dbUser.tenantId,
            };
            request.user = user; // Attach for downstream
          }
        } catch (e) {
          console.error("Failed to fetch user in RolesGuard", e);
        }
      }
    }

    if (!user?.systemRole) {
      throw new ForbiddenException(
        'User role not found in request. Please login again.',
      );
    }

    const userRoleIndex = this.roleHierarchy.indexOf(
      user.systemRole as SystemRole,
    );

    // Check if the user's role is equal or higher (lower index) than ANY of the required roles
    const hasPermission = requiredRoles.some((requiredRole) => {
      const requiredRoleIndex = this.roleHierarchy.indexOf(requiredRole);
      return userRoleIndex <= requiredRoleIndex;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the required role to access this resource',
      );
    }

    return true;
  }
}
