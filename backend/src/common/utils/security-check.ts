import { Logger } from '@nestjs/common';

const REQUIRED_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'strict-transport-security',
];

export function verifySecurityHeaders(responseHeaders: Record<string, string | string[]>): string[] {
  const missing: string[] = [];
  const headers = Object.keys(responseHeaders).map((h) => h.toLowerCase());
  
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      missing.push(required);
    }
  }
  
  if (missing.length > 0) {
    Logger.warn(`Missing security headers: ${missing.join(', ')}`);
  }
  
  return missing;
}
