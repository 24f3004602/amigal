import { Controller, Post, Get, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ strict: { limit: 5, ttl: 60000 } }) // 5 attempts per minute per IP
  async register(
    @Body() body: { email: string; password: string; displayName?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body.email, body.password, body.displayName);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Post('login')
  @Throttle({ strict: { limit: 5, ttl: 60000 } }) // 5 attempts per minute per IP
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result.user;
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
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.me(req.user.userId);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) await this.authService.logout(refreshToken);
    this.clearCookies(res);
    return { success: true };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = isProduction ? 'strict' : 'lax';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
  }

  private clearCookies(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = isProduction ? 'strict' : 'lax';

    res.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite, path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite, path: '/auth/refresh' });
  }
}
