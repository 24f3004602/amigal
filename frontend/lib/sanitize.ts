import DOMPurify from 'dompurify';

const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

const CHAT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_ATTR: ['style', 'onerror', 'onload'],
};

export function sanitizeStrict(input: string): string {
  if (typeof window === 'undefined') return input; // SSR safety
  return DOMPurify.sanitize(input, STRICT_CONFIG) as string;
}

export function sanitizeChat(input: string): string {
  if (typeof window === 'undefined') return input;
  return DOMPurify.sanitize(input, CHAT_CONFIG) as string;
}

// URL validation
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
