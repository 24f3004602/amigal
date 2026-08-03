import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const handshake = client.handshake;

    const cookieHeader = handshake.headers.cookie || '';
    const cookies = this.parseCookies(cookieHeader);
    const token = cookies.access_token;

    if (!token) {
      client.disconnect(true);
      throw new UnauthorizedException('No access token in cookies');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      client.user = { userId: payload.userId, email: payload.email };
      return true;
    } catch {
      client.disconnect(true);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private parseCookies(header: string): Record<string, string> {
    return header.split(';').reduce((acc, cookie) => {
      const [key, ...rest] = cookie.trim().split('=');
      if (key && rest.length) acc[key] = decodeURIComponent(rest.join('='));
      return acc;
    }, {} as Record<string, string>);
  }
}
