// BE-011: Audit Logging Service
import { v4 as uuidv4 } from 'uuid';
import { AuditLog, AuditAction } from '../types';
import { dataStore } from './dataStore';

export class AuditService {
  async log(data: {
    userId: string;
    username: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      ...data,
      timestamp: new Date(),
    };

    return dataStore.create<AuditLog>('auditLogs', auditLog);
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    let logs = dataStore.findAll<AuditLog>('auditLogs');

    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters?.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }
    if (filters?.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]> {
    return dataStore.findMany<AuditLog>(
      'auditLogs',
      log => log.entityType === entityType && log.entityId === entityId
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserActivity(userId: string, limit?: number): Promise<AuditLog[]> {
    const logs = dataStore.findMany<AuditLog>('auditLogs', log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? logs.slice(0, limit) : logs;
  }
}

export const auditService = new AuditService();
