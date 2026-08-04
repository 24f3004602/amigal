import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { randomBytes } from 'crypto';

@Injectable()
export class CspInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    
    // Generate cryptographically secure nonce for this request
    const nonce = randomBytes(16).toString('base64');
    
    // Store nonce on response locals for access in controllers if needed
    response.locals.cspNonce = nonce;

    // Strict CSP policy
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https: blob:`,
      `font-src 'self' https: data:`,
      `connect-src 'self' ${process.env.FRONTEND_URL || 'http://localhost:3000'} wss: ws:`,
      `media-src 'self' blob:`,
      `frame-src 'none'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
      `block-all-mixed-content`,
    ].join('; ');

    response.setHeader('Content-Security-Policy', csp);
    response.setHeader('X-Content-Security-Policy', csp); // Legacy IE
    response.setHeader('X-WebKit-CSP', csp); // Legacy Safari

    // Additional security headers
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
    );
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    return next.handle();
  }
}
