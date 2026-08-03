import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception instanceof WsException
      ? exception.getError()
      : exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message = typeof error === 'string' ? error : (error as any).message || 'Unknown error';
    const code = (error as any).code || 'INTERNAL_ERROR';

    this.logger.error({ err: exception, clientId: client.id }, 'WebSocket exception');

    client.emit('error', { code, message });
  }
}
