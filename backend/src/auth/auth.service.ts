import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName || `User ${Math.floor(Math.random() * 10000)}`,
      },
      select: { id: true, email: true, displayName: true, reputationScore: true, subscriptionTier: true },
    });
    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned) {
      if (user.banUntil && user.banUntil > new Date()) {
        throw new UnauthorizedException('Account suspended');
      }
    }
    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id, email: user.email, displayName: user.displayName,
        reputationScore: user.reputationScore, subscriptionTier: user.subscriptionTier,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.generateTokens(stored.user.id, stored.user.email);
    return {
      user: {
        id: stored.user.id, email: stored.user.email, displayName: stored.user.displayName,
        reputationScore: stored.user.reputationScore, subscriptionTier: stored.user.subscriptionTier,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async me(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true, email: true, displayName: true,
          reputationScore: true, subscriptionTier: true,
          videoChatsUsed: true, videoChatsLimit: true,
          subscriptionStatus: true, subscriptionEndsAt: true,
        },
      });
      return user;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = uuidv4();
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
}
