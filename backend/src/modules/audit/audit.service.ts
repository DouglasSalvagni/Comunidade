import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export type AuditHttpInput = {
  userId?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  controller?: string;
  handler?: string;
  durationMs?: number;
  errorName?: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async recordHttp(input: AuditHttpInput): Promise<void> {
    await this.auditLogRepository.insert({
      userId: input.userId ?? null,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      controller: input.controller ?? null,
      handler: input.handler ?? null,
      durationMs: typeof input.durationMs === 'number' ? input.durationMs : null,
      errorName: input.errorName ?? null,
      metadata: input.metadata ?? null,
    });
  }
}

