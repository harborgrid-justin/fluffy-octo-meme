// BE-002: Authentication Service (JWT + refresh tokens)
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, AuthTokens, RefreshToken, JWTPayload } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export class AuthService {
  async login(username: string, password: string): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const user = dataStore.getUserByUsername(username);

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.active) {
      throw new AppError(403, 'Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Update last login
    dataStore.update<User>('users', user.id, { lastLogin: new Date() } as any);

    const tokens = await this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  async register(userData: {
    username: string;
    password: string;
    email: string;
    department: string;
    role?: string;
  }): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const existingUser = dataStore.getUserByUsername(userData.username) ||
      dataStore.getUserByEmail(userData.email);

    if (existingUser) {
      throw new AppError(400, 'User with this username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user: User = {
      id: uuidv4(),
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: (userData.role as any) || 'user',
      department: userData.department,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.create<User>('users', user);

    const tokens = await this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;

      const storedToken = dataStore.getRefreshToken(refreshToken);
      if (!storedToken) {
        throw new AppError(403, 'Invalid refresh token');
      }

      if (new Date() > storedToken.expiresAt) {
        dataStore.deleteRefreshToken(refreshToken);
        throw new AppError(403, 'Refresh token expired');
      }

      const user = dataStore.findById<User>('users', decoded.id);
      if (!user || !user.active) {
        throw new AppError(403, 'User not found or inactive');
      }

      // Delete old refresh token
      dataStore.deleteRefreshToken(refreshToken);

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(403, 'Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    dataStore.deleteRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    dataStore.deleteUserRefreshTokens(userId);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRY } as SignOptions);
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: JWT_REFRESH_EXPIRY } as SignOptions);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenDoc: RefreshToken = {
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt,
      createdAt: new Date(),
    };

    dataStore.create<RefreshToken>('refreshTokens', refreshTokenDoc);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(JWT_EXPIRY),
    };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new AppError(403, 'Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
