import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditService } from '@/modules/audit/audit.service';
import { AntiAbuseService } from '@/common/anti-abuse/anti-abuse.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly antiAbuseService: AntiAbuseService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const start = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<any>();
    const res = http.getResponse<any>();

    const method = String(req?.method || '');
    const path = String(req?.originalUrl || req?.url || '');
    const userId = req?.user?.userId ? String(req.user.userId) : undefined;
    const controller = context.getClass()?.name;
    const handler = context.getHandler()?.name;
    const ip = this.antiAbuseService.getClientIp(req);
    const userAgent = this.antiAbuseService.getUserAgent(req);

    const rawRequestId =
      req?.headers?.['x-request-id'] ??
      req?.headers?.['x-correlation-id'] ??
      req?.headers?.['cf-ray'];
    const requestId = rawRequestId ? String(rawRequestId).slice(0, 100) : undefined;

    return next.handle().pipe(
      tap(() => {
        const statusCode = Number(res?.statusCode) || 200;
        const durationMs = Date.now() - start;
        this.auditService
          .recordHttp({
            userId,
            method,
            path,
            statusCode,
            ip,
            userAgent,
            requestId,
            controller,
            handler,
            durationMs,
          })
          .catch(() => undefined);
      }),
      catchError((err: any) => {
        const statusCode =
          err instanceof HttpException
            ? err.getStatus()
            : Number(res?.statusCode) || 500;
        const durationMs = Date.now() - start;
        const errorName = err?.name ? String(err.name).slice(0, 100) : undefined;
        this.auditService
          .recordHttp({
            userId,
            method,
            path,
            statusCode,
            ip,
            userAgent,
            requestId,
            controller,
            handler,
            durationMs,
            errorName,
          })
          .catch(() => undefined);
        return throwError(() => err);
      }),
    );
  }
}

