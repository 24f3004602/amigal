import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'text/plain', 'text/markdown'],
  video: ['video/mp4', 'video/webm'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAGIC_BYTES: Record<string, Buffer> = {
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/gif': Buffer.from([0x47, 0x49, 0x46]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
  'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]),
};

export interface ValidatedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  sanitizedName: string;
}

export function validateFile(file: Express.Multer.File, allowedTypes: (keyof typeof ALLOWED_MIME_TYPES)[]): ValidatedFile {
  if (!file) throw new BadRequestException('No file provided');

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(`File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // MIME type whitelist
  const allowedMimes = allowedTypes.flatMap((t) => ALLOWED_MIME_TYPES[t]);
  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
  }

  // Magic bytes verification (prevents extension spoofing)
  const magic = MAGIC_BYTES[file.mimetype];
  if (magic && !file.buffer.subarray(0, magic.length).equals(magic)) {
    throw new BadRequestException('File content does not match declared type');
  }

  // Filename sanitization
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);

  // Prevent path traversal
  if (sanitizedName.includes('..') || sanitizedName.startsWith('/')) {
    throw new BadRequestException('Invalid filename');
  }

  return {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    sanitizedName,
  };
}
