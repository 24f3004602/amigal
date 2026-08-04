import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

// Strict config: no HTML at all for most fields
const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// Permissive config: for rich text/chat (if needed later)
const RICH_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(private readonly allowRich: boolean = false) {}

  transform(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }
    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        sanitized[key] = this.transform(value[key]);
      }
      return sanitized;
    }
    return value;
  }

  private sanitizeString(str: string): string {
    const config = this.allowRich ? RICH_CONFIG : STRICT_CONFIG;
    const clean = DOMPurify.sanitize(str, config);
    
    // Additional layer: normalize Unicode to prevent homograph attacks
    const normalized = (clean as string).normalize('NFKC');
    
    // Block null bytes and control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized)) {
      throw new BadRequestException('Invalid characters in input');
    }
    
    return normalized.trim();
  }
}
