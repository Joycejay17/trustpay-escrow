export interface NotificationItem {
  id: string;
  recipient_address: string;
  sender_address?: string | null;
  project_id?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  category?: string;
}

export type NotificationIntervalKey = '7d' | '3d' | '24h' | '2h';
export type NotificationChannelKey = 'in_app' | 'browser_push' | 'telegram';

export interface NotificationPreferences {
  intervals: Record<NotificationIntervalKey, boolean>;
  channels: Record<NotificationChannelKey, boolean>;
  telegramChatId?: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  intervals: {
    '7d': true,
    '3d': true,
    '24h': true,
    '2h': false,
  },
  channels: {
    in_app: true,
    browser_push: false,
    telegram: false,
  },
  telegramChatId: '',
};
