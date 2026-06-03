import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: { tenantId: string } }>();
    // In production, this would come from the JWT payload
    // For now, we support a header for development/testing
    return request.user?.tenantId || request.headers['x-tenant-id'];
  },
);
