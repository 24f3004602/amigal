import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token || client.handshake.headers.cookie?.match(/access_token=([^;]+)/)?.[1];
    if (!token) return false;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      client.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
