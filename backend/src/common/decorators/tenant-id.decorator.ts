import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // In production, this would come from the JWT payload
    // For now, we support a header for development/testing
    return request.user?.tenantId || request.headers['x-tenant-id'];
  },
);
