import { Metadata } from 'next';
import { NotificationsClient } from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Notifications | CareerAI',
  description: 'View your notifications and system alerts',
};

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Stay updated with your latest alerts and activity.
        </p>
      </div>
      <NotificationsClient />
    </div>
  );
}
