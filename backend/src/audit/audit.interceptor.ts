import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;

    // Only log mutations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap((data) => {
          const tenantId = user?.tenantId || body?.tenantId;
          if (tenantId) {
            this.auditService.log({
              tenantId,
              userId: user?.id,
              module: url.split('/')[2] || 'system',
              action: method,
              details: {
                requestBody: body,
                responseBody: data,
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
