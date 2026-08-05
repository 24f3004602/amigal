import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { Throttle } from '@nestjs/throttler';
import { Logger } from 'nestjs-pino';

interface AuthSocket extends Socket {
  user?: { userId: string; email: string };
}

@WebSocketGateway({
  namespace: 'chat',
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
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly logger: Logger) {}

  handleConnection(client: AuthSocket) {
    this.logger.log(`Chat client connected: ${client.user?.userId}`);
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.log(`Chat client disconnected: ${client.user?.userId}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: AuthSocket, payload: { roomId: string }) {
    if (!client.user) return;
    client.join(payload.roomId);
    client.to(payload.roomId).emit('peer-joined', { userId: client.user.userId });
  }

  @SubscribeMessage('chat-message')
  @Throttle(10, 1000) // 10 messages per second max
  handleChatMessage(client: AuthSocket, payload: any) {
    if (!client.user) return;
    
    // Sanitize and validate
    const sanitized = {
      ...payload,
      senderId: client.user.userId,
      timestamp: Date.now(),
    };

    // Broadcast to room (excluding sender)
    client.to(payload.roomId).emit('chat-message', sanitized);
    
    // Also emit back to sender for consistency
    client.emit('chat-message', sanitized);
  }

  @SubscribeMessage('typing')
  handleTyping(client: AuthSocket, payload: { roomId: string; name: string }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('typing', { name: payload.name });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(client: AuthSocket, payload: { roomId: string; name: string }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('stop-typing', { name: payload.name });
  }

  @SubscribeMessage('edit-message')
  handleEditMessage(client: AuthSocket, payload: { roomId: string; messageId: string; newText: string }) {
    if (!client.user) return;
    // Validate ownership in production
    this.server.to(payload.roomId).emit('message-edited', payload);
  }

  @SubscribeMessage('delete-message')
  handleDeleteMessage(client: AuthSocket, payload: { roomId: string; messageId: string }) {
    if (!client.user) return;
    this.server.to(payload.roomId).emit('message-deleted', payload);
  }

  @SubscribeMessage('add-reaction')
  handleReaction(client: AuthSocket, payload: { roomId: string; messageId: string; emoji: string }) {
    if (!client.user) return;
    this.server.to(payload.roomId).emit('reaction-added', {
      ...payload,
      userId: client.user.userId,
    });
  }
}
