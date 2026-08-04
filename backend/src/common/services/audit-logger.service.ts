import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction = 
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTER' 
  | 'ROOM_CREATE' | 'ROOM_JOIN' | 'ROOM_LEAVE' | 'ROOM_END'
  | 'MESSAGE_SEND' | 'MESSAGE_DELETE' | 'MESSAGE_EDIT'
  | 'REPORT_SUBMIT' | 'USER_BAN' | 'USER_UNBAN'
  | 'SETTINGS_CHANGE' | 'FILE_UPLOAD' | 'PAYMENT_INIT'
  | 'ADMIN_ACTION';

export interface AuditContext {
  userId?: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogger {
  private readonly logger = new Logger(AuditLogger.name);

  constructor(private prisma: PrismaService) {}

  async log(action: AuditAction, context: AuditContext, description: string) {
    const timestamp = new Date().toISOString();
    
    // Structured log for SIEM ingestion
    this.logger.log({
      type: 'AUDIT',
      action,
      timestamp,
      userId: context.userId || 'anonymous',
      ip: this.maskIp(context.ip),
      userAgent: context.userAgent,
      description,
      metadata: this.sanitizeMetadata(context.metadata),
    });

    // Persist to database for compliance
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          userId: context.userId,
          ipAddress: context.ip,
          userAgent: context.userAgent,
          description,
          metadata: context.metadata || {},
        },
      });
    } catch (err) {
      this.logger.error('Failed to persist audit log', err);
    }
  }

  private maskIp(ip: string): string {
    // GDPR: mask last octet of IPv4, last 80 bits of IPv6
    if (ip.includes('.')) {
      return ip.replace(/\.\d+$/, '.xxx');
    }
    return ip.replace(/:[^:]*$/, ':xxxx');
  }

  private sanitizeMetadata(meta?: Record<string, any>): Record<string, any> {
    if (!meta) return {};
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'ssn', 'cvv'];
    const sanitized = { ...meta };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
