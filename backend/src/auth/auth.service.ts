import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, displayName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, displayName, provider: 'local' },
    });

    return this.createSession(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.createSession(user);
  }

  async oauthLogin(oauthUser: any) {
    let user = await this.prisma.user.findFirst({
      where: {
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          displayName: oauthUser.displayName,
          avatarUrl: oauthUser.avatarUrl,
          provider: oauthUser.provider,
          providerId: oauthUser.providerId,
        },
      });
    }

    return this.createSession(user);
  }

  private async createSession(user: any) {
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        videoChatsUsed: user.videoChatsUsed,
        videoChatsLimit: user.videoChatsLimit,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefresh } = this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    await this.prisma.refreshToken.create({
      data: { token: newRefresh, userId: tokenRecord.user.id, expiresAt },
    });

    return { accessToken, refreshToken: newRefresh };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        reputationScore: true,
        subscriptionTier: true,
        videoChatsUsed: true,
        videoChatsLimit: true,
        isBanned: true,
        banUntil: true,
      },
    });
    return user;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return { success: true };
  }
}
