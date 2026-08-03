import { Controller, Post, Get, Body, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; displayName?: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body.email, body.password, body.displayName);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    this.setCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?auth=success`);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    this.setCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?auth=success`);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const result = await this.authService.refresh(refreshToken);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { success: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      return this.authService.me(payload.userId);
    } catch {
      return null;
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}

import { UnauthorizedException } from '@nestjs/common';
