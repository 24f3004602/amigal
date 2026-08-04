import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use authenticated user ID if available, fallback to IP
    const request = req as Request;
    const userId = (request as any).user?.userId;
    if (userId) return `user:${userId}`;
    
    // Include User-Agent fingerprint to reduce IP collision
    const ua = request.headers['user-agent'] || 'unknown';
    const uaHash = Buffer.from(ua).toString('base64').slice(0, 16);
    return `ip:${request.ip}:${uaHash}`;
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    // Log rate limit violations for security monitoring
    console.warn({
      type: 'RATE_LIMIT_EXCEEDED',
      ip: request.ip,
      path: request.url,
      userId: (request as any).user?.userId,
      timestamp: new Date().toISOString(),
    });

    super.throwThrottlingException(context);
  }
}
