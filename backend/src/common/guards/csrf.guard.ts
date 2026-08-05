import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { randomBytes, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly tokenHeader = 'x-csrf-token';
  private readonly cookieName = 'csrf_token';

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse();
    
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
      // Generate new token for GET requests if missing
      if (!req.cookies?.[this.cookieName]) {
        const token = randomBytes(32).toString('hex');
        res.cookie(this.cookieName, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.setHeader('X-CSRF-Token', token);
      }
      return true;
    }

    // Validate token for state-changing requests
    const cookieToken = req.cookies?.[this.cookieName];
    const headerToken = req.headers[this.tokenHeader] as string;
    const bodyToken = req.body?._csrf;

    const submittedToken = headerToken || bodyToken;

    if (!cookieToken || !submittedToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Constant-time comparison to prevent timing attacks
    if (!this.timingSafeEqual(cookieToken, submittedToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    // Rotate token after successful validation (prevents BREACH)
    const newToken = randomBytes(32).toString('hex');
    res.cookie(this.cookieName, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.setHeader('X-CSRF-Token', newToken);

    return true;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      return bufA.length === bufB.length && cryptoTimingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
