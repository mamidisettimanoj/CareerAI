export type NotificationCategory = 'Academic' | 'Placement' | 'Goal' | 'Portfolio' | 'Preparation';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  date: string; // ISO string
  isRead: boolean;
  isDismissed: boolean;
  link?: string; // Optional path to navigate to
}
