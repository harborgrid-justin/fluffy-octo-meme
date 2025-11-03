import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, RequestContext } from '../types';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'Access token required');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = decoded;
    req.context = {
      user: decoded,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(403, 'Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.context = {
        user: decoded,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
