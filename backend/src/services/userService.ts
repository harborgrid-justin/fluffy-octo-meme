// BE-001: User Management API (CRUD with roles)
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class UserService {
  async createUser(userData: {
    username: string;
    password: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    department: string;
    organizationId?: string;
  }, createdBy?: string): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = dataStore.getUserByUsername(userData.username) ||
      dataStore.getUserByEmail(userData.email);

    if (existingUser) {
      throw new AppError(400, 'User with this username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user: User = {
      id: uuidv4(),
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      department: userData.department,
      organizationId: userData.organizationId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    dataStore.create<User>('users', user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers(filters?: {
    role?: UserRole;
    department?: string;
    active?: boolean;
  }): Promise<Omit<User, 'password'>[]> {
    let users = dataStore.findAll<User>('users');

    if (filters?.role) {
      users = users.filter(u => u.role === filters.role);
    }
    if (filters?.department) {
      users = users.filter(u => u.department === filters.department);
    }
    if (filters?.active !== undefined) {
      users = users.filter(u => u.active === filters.active);
    }

    return users.map(({ password, ...user }) => user);
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = dataStore.findById<User>('users', id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<Omit<User, 'password'>> {
    const user = dataStore.findById<User>('users', id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Don't allow password updates through this method
    const { password, ...safeUpdates } = updates as any;

    const updatedUser = dataStore.update<User>('users', id, safeUpdates);
    if (!updatedUser) {
      throw new AppError(404, 'User not found');
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const success = dataStore.delete<User>('users', id);
    if (!success) {
      throw new AppError(404, 'User not found');
    }
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = dataStore.findById<User>('users', id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new AppError(400, 'Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dataStore.update<User>('users', id, { password: hashedPassword } as any);
  }

  async getUsersByRole(role: UserRole): Promise<Omit<User, 'password'>[]> {
    const users = dataStore.findMany<User>('users', u => u.role === role);
    return users.map(({ password, ...user }) => user);
  }

  async getUsersByDepartment(department: string): Promise<Omit<User, 'password'>[]> {
    const users = dataStore.findMany<User>('users', u => u.department === department);
    return users.map(({ password, ...user }) => user);
  }
}

export const userService = new UserService();
