import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Badge } from '../ui';
import { Notification, NotificationType } from '@/types';
import { format } from 'date-fns';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function Notifications({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeVariant = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BUDGET_APPROVED: return 'success';
      case NotificationType.BUDGET_REJECTED: return 'error';
      case NotificationType.APPROVAL_REQUIRED: return 'warning';
      case NotificationType.EXECUTION_WARNING: return 'warning';
      case NotificationType.MILESTONE_DUE: return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        action={
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
        }
      />

      <CardContent>
        <div className="space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                } ${onNotificationClick ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => {
                  onNotificationClick?.(notification);
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <Badge variant={getTypeVariant(notification.type)} size="sm">
                        {notification.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                      <span className={`font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                {notification.actionUrl && (
                  <div className="mt-3 pt-3 border-t">
                    <a
                      href={notification.actionUrl}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details →
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Notification Bell Icon Component
interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      aria-label="Notifications"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
