import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AppError } from './errorHandler';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
};

export const authorizeAny = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    next();
  };
};

// Resource-based authorization
export const authorizeResource = (
  resourceOwnerField: string = 'createdBy'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    // Admins can access everything
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // This will be checked in the controller/service layer
    // We just set a flag here
    (req as any).requireOwnership = true;
    (req as any).ownerField = resourceOwnerField;
    next();
  };
};

// Department-based authorization
export const authorizeDepartment = (departmentField: string = 'department') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    // Admins can access everything
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // This will be checked in the controller/service layer
    (req as any).requireDepartment = true;
    (req as any).departmentField = departmentField;
    next();
  };
};
