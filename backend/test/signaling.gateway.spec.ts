import { Test } from '@nestjs/testing';
import { SignalingGateway } from '../src/signaling/signaling.gateway';
import { RedisService } from '../src/common/redis.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Logger } from 'nestjs-pino';

describe('SignalingGateway', () => {
  let gateway: SignalingGateway;
  let mockServer: any;
  let mockClient: any;

  const mockRedis = {
    getClient: () => ({
      duplicate: () => ({
        subscribe: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        unsubscribe: jest.fn(),
        disconnect: jest.fn(),
      }),
    }),
  };

  const mockPrisma = {
    session: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SignalingGateway,
        { provide: RedisService, useValue: mockRedis },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Logger, useValue: { info: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<SignalingGateway>(SignalingGateway);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      socketsLeave: jest.fn(),
    };
    gateway.server = mockServer;

    mockClient = {
      user: { userId: 'user-1', email: 'test@example.com' },
      join: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      handshake: { headers: { cookie: 'access_token=test' } },
    };
  });

  describe('handleConnection', () => {
    it('should disconnect clients without auth', async () => {
      const unauthClient = { ...mockClient, user: null, disconnect: jest.fn() };
      await gateway.handleConnection(unauthClient);
      expect(unauthClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should subscribe to Redis for authenticated users', async () => {
      await gateway.handleConnection(mockClient);
      expect(mockClient.__subscriber).toBeDefined();
    });
  });

  describe('handleJoinRoom', () => {
    it('should reject unauthorized room access', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await gateway.handleJoinRoom(mockClient, { roomId: 'room-1' });

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        code: 'UNAUTHORIZED',
        message: 'Not authorized for this room',
      });
    });

    it('should join valid rooms', async () => {
      mockPrisma.session.findFirst.mockResolvedValue({
        id: 'session-1',
        roomId: 'room-1',
        userAId: 'user-1',
      });

      await gateway.handleJoinRoom(mockClient, { roomId: 'room-1' });

      expect(mockClient.join).toHaveBeenCalledWith('room-1');
      expect(mockClient.to).toHaveBeenCalledWith('room-1');
    });
  });

  describe('handleEndCall', () => {
    it('should end call and notify room', async () => {
      await gateway.handleEndCall(mockClient, { roomId: 'room-1' });

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        data: expect.objectContaining({
          endedAt: expect.any(Date),
          terminationReason: 'normal',
        }),
      });
      expect(mockServer.to).toHaveBeenCalledWith('room-1');
    });
  });
});
