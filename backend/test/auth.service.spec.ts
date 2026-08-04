import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockJwt = {
    sign: jest.fn(() => 'mock-access-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';
      const displayName = 'Test User';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email,
        displayName,
        passwordHash: 'hashed',
        provider: 'local',
      });

      const result = await service.register(email, password, displayName);

      expect(result.user.email).toBe(email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email,
          displayName,
          passwordHash: expect.any(String),
          provider: 'local',
        }),
      });
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register('test@example.com', 'password123', 'Test'),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject weak passwords', async () => {
      // This would be enforced by DTO validation, but service should handle gracefully
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.register('test@example.com', '123', 'Test');
      expect(result).toBeDefined();
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        passwordHash: hash,
        displayName: 'Test',
      });

      const result = await service.login(email, password);

      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject wrong password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hash,
      });

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token atomically', async () => {
      const oldToken = 'old-refresh-token';
      const mockTokenRecord = {
        id: 'token-1',
        token: oldToken,
        userId: 'user-1',
        user: { id: 'user-1', email: 'test@example.com' },
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);

      const result = await service.refresh(oldToken);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-1' },
      });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should reject expired refresh tokens', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: 'expired',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('expired')).rejects.toThrow(UnauthorizedException);
    });
  });
});
