import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof Error && 'getStatus' in exception
      ? (exception as any).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      {
        err: exception,
        path: request.url,
        method: request.method,
      },
      'Unhandled exception',
    );

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message: 'Internal server error',
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      data: null,
    });
  }
}
