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

  // Track subscriptions safely
  private subscriptions = new Map<string, { subscriber: any; handler: (ch: string, message: string) => void }>();

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
    subscriber.on('message', handler);

    this.subscriptions.set(client.id, { subscriber, handler });

    this.logger.info(`Client connected: ${client.user.userId}`);
  }

  async handleDisconnect(client: AuthSocket) {
    const sub = this.subscriptions.get(client.id);

    if (sub) {
      const { subscriber, handler } = sub;
      const channel = `user:${client.user?.userId}:match`;
      
      subscriber.off('message', handler);
      await subscriber.unsubscribe(channel);
      subscriber.disconnect();
      this.subscriptions.delete(client.id);
    }

    this.logger.info(`Client disconnected: ${client.user?.userId}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(client: AuthSocket, payload: { roomId: string }) {
    if (!client.user) return;

    const session = await this.prisma.session.findFirst({
      where: {
        roomId: payload.roomId,
        OR: [
          { userAId: client.user.userId },
          { userBId: client.user.userId },
        ],
        endedAt: null,
      },
    });

    if (!session) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authorized for this room' });
      return;
    }

    client.join(payload.roomId);
    client.to(payload.roomId).emit('peer-joined', { userId: client.user.userId });
    this.logger.info(`User ${client.user.userId} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('offer')
  handleOffer(client: AuthSocket, payload: { roomId: string; offer: RTCSessionDescriptionInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('offer', {
      offer: payload.offer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: AuthSocket, payload: { roomId: string; answer: RTCSessionDescriptionInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('answer', {
      answer: payload.answer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: AuthSocket, payload: { roomId: string; candidate: RTCIceCandidateInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('ice-candidate', {
      candidate: payload.candidate,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('end-call')
  async handleEndCall(client: AuthSocket, payload: { roomId: string }) {
    if (!client.user) return;

    await this.prisma.session.updateMany({
      where: { roomId: payload.roomId },
      data: {
        endedAt: new Date(),
        terminationReason: 'normal',
      },
    });

    this.server.to(payload.roomId).emit('call-ended', { endedBy: client.user.userId });
    this.server.in(payload.roomId).socketsLeave(payload.roomId);
    this.logger.info(`Call ended in room ${payload.roomId} by ${client.user.userId}`);
  }
}
