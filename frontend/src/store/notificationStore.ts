import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter((n) => !n.read).length;
      return { notifications: newNotifications, unreadCount };
    }),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    })),

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length
    })
}));
