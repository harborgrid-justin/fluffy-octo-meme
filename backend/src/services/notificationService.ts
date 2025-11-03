// BE-017: Notification Service
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, NotificationPriority } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    priority?: NotificationPriority;
  }): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      ...data,
      priority: data.priority || NotificationPriority.MEDIUM,
      read: false,
      createdAt: new Date(),
    };

    return dataStore.create<Notification>('notifications', notification);
  }

  async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    let notifications = dataStore.findMany<Notification>(
      'notifications',
      n => n.userId === userId
    );

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = dataStore.findById<Notification>('notifications', id);
    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }
    return notification;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = dataStore.update<Notification>('notifications', id, {
      read: true,
      readAt: new Date(),
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId, true);

    notifications.forEach(notification => {
      dataStore.update<Notification>('notifications', notification.id, {
        read: true,
        readAt: new Date(),
      });
    });
  }

  async deleteNotification(id: string): Promise<void> {
    const success = dataStore.delete<Notification>('notifications', id);
    if (!success) {
      throw new AppError(404, 'Notification not found');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId, true);
    return notifications.length;
  }
}

export const notificationService = new NotificationService();
