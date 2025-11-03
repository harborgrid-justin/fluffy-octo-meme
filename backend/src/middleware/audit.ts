import { Request, Response, NextFunction } from 'express';
import { AuditLog, AuditAction } from '../types';
import { auditService } from '../services/auditService';

export const auditLog = (action: AuditAction, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Log the action after the response
      setImmediate(async () => {
        try {
          const entityId = req.params.id || data?.data?.id || '';
          const success = res.statusCode >= 200 && res.statusCode < 400;

          await auditService.log({
            userId: req.user?.id || 'anonymous',
            username: req.user?.username || 'anonymous',
            action,
            entityType,
            entityId,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success,
            errorMessage: success ? undefined : data?.message,
          });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
};
