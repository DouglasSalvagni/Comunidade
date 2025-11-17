import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class DevExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? (exception as HttpException).getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const base = isHttp ? (exception as HttpException).getResponse() : { message: 'Internal server error' };

    const payload = {
      statusCode: status,
      path: request?.url,
      method: request?.method,
      timestamp: new Date().toISOString(),
      error: exception?.name,
      message: (typeof base === 'string' ? base : (base as any)?.message) || exception?.message || 'Internal server error',
      details: (typeof base === 'object' ? base : undefined),
      stack: exception?.stack,
    };

    // Log completo no console em dev
    // eslint-disable-next-line no-console
    console.error('[DevExceptionFilter]', payload);

    response.status(status).json(payload);
  }
}