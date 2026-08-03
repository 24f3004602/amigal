import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UseFilters } from '@nestjs/common';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { RedisService } from '../common/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from 'nestjs-pino';

interface AuthSocket extends Socket {
  user?: { userId: string; email: string };
}

@WebSocketGateway({
  namespace: 'signaling',
  cors: {
    origin: (origin, callback) => {
      const allowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',').map(o => o.trim());
      if (!origin || allowed.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed'), false);
    },
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async handleConnection(client: AuthSocket) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    // Use a dedicated subscriber client to avoid blocking the main Redis connection
    const subscriber = this.redis.getClient().duplicate();
    const channel = `user:${client.user.userId}:match`;

    const handler = (ch: string, message: string) => {
      if (ch === channel) client.emit('match-found', JSON.parse(message));
    };

    await subscriber.subscribe(channel);
    subscriber.on('
