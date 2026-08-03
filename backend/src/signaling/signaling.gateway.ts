import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { RedisService } from '../common/redis.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthSocket extends Socket {
  user?: { userId: string; email: string };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthSocket) {
    if (!client.user) {
      client.disconnect();
      return;
    }

    const redisClient = this.redis.getClient();
    await redisClient.subscribe(`user:${client.user.userId}:match`);

    redisClient.on('message', (channel, message) => {
      if (channel === `user:${client.user!.userId}:match`) {
        client.emit('match-found', JSON.parse(message));
      }
    });

    console.log(`Client connected: ${client.user.userId}`);
  }

  handleDisconnect(client: AuthSocket) {
    console.log(`Client disconnected: ${client.user?.userId}`);
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
      client.emit('error', { message: 'Not authorized for this room' });
      return;
    }

    client.join(payload.roomId);
    client.to(payload.roomId).emit('peer-joined', { userId: client.user.userId });
  }

  @SubscribeMessage('offer')
  handleOffer(client: AuthSocket, payload: { roomId: string; offer: any }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('offer', {
      offer: payload.offer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: AuthSocket, payload: { roomId: string; answer: any }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('answer', {
      answer: payload.answer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: AuthSocket, payload: { roomId: string; candidate: any }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('ice-candidate', {
      candidate: payload.candidate,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(client: AuthSocket, payload: { roomId: string; text: string }) {
    if (!client.user) return;

    const censored = this.censorText(payload.text);

    const session = await this.prisma.session.findUnique({
      where: { roomId: payload.roomId },
    });

    if (session) {
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          senderId: client.user.userId,
          text: payload.text,
          censored: censored !== payload.text,
        },
      });
    }

    client.to(payload.roomId).emit('chat-message', {
      text: censored,
      senderId: client.user.userId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(client: AuthSocket, payload: { roomId: string; isTyping: boolean }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('typing', {
      isTyping: payload.isTyping,
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

    client.to(payload.roomId).emit('call-ended', { endedBy: client.user.userId });
    this.server.in(payload.roomId).socketsLeave(payload.roomId);
  }

  private censorText(text: string): string {
    const badWords = [
      'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy',
      'cock', 'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
      'kill yourself', 'kys', 'rape', 'rapist', 'pedo', 'cp',
    ];
    let result = text;
    for (const word of badWords) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    }
    return result;
  }
}
