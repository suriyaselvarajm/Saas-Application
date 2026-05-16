import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const method = request.method;
    const url = request.url;
    const body = request.body as Record<string, unknown>;
    const user = request.user;
    const ip = request.ip;

    // Only log mutations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap((data: unknown) => {
          const tenantId =
            user?.tenantId || (body as { tenantId?: string })?.tenantId;
          if (tenantId) {
            void this.auditService.log({
              tenantId,
              userId: user?.id,
              module: url.split('/')[2] || 'system',
              action: method,
              details: {
                requestBody: body,
                responseBody: data as Record<string, unknown>,
              },
              ipAddress: ip,
            });
          }
        }),
      );
    }

    return next.handle();
  }
}
