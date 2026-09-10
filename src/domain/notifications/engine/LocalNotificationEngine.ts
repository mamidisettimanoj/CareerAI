import { NotificationData } from '../types/notification.types';
import { repositories } from '@/services/ServiceLocator';
import { v4 as uuidv4 } from 'uuid';

export class LocalNotificationEngine {
  async generateNotifications(): Promise<void> {
    const existing = await repositories.notifications.getNotifications();
    const newNotifications: NotificationData[] = [];

    // Check Certifications
    const certs = await repositories.portfolio.getCertifications();
    for (const cert of certs) {
      if (cert.status === 'Active' && cert.expiryDate) {
        const daysLeft = (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysLeft > 0 && daysLeft <= 30) {
          const title = `Certification Expiring Soon`;
          const message = `Your ${cert.name} certification expires in ${Math.ceil(daysLeft)} days.`;
          if (!existing.some(n => n.title === title && n.message === message)) {
            newNotifications.push({
              id: uuidv4(),
              title,
              message,
              category: 'Portfolio',
              priority: daysLeft <= 7 ? 'CRITICAL' : 'HIGH',
              date: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
              link: '/certifications'
            });
          }
        }
      }
    }

    // Check Upcoming Interviews
    const interviews = await repositories.placement.getInterviews();
    for (const interview of interviews) {
      if (interview.status === 'SCHEDULED') {
        const daysLeft = (new Date(interview.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysLeft >= 0 && daysLeft <= 3) {
          const title = `Upcoming Interview`;
          const message = `You have an interview scheduled in ${Math.ceil(daysLeft)} days.`;
          if (!existing.some(n => n.title === title && n.message === message)) {
            newNotifications.push({
              id: uuidv4(),
              title,
              message,
              category: 'Placement',
              priority: 'CRITICAL',
              date: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
              link: '/placement/applications'
            });
          }
        }
      }
    }

    // Check Active Backlogs
    const backlogs = await repositories.academic.getBacklogs();
    const activeBacklogs = backlogs.filter(b => b.status === 'Active');
    if (activeBacklogs.length > 0) {
      const title = `Active Backlogs Alert`;
      const message = `You have ${activeBacklogs.length} active backlogs. Focus on clearing them.`;
      // Ensure we don't spam this every day, check if it was sent recently
      const recentAlert = existing.find(n => n.title === title && (Date.now() - new Date(n.date).getTime()) < 7 * 24 * 60 * 60 * 1000);
      if (!recentAlert) {
        newNotifications.push({
          id: uuidv4(),
          title,
          message,
          category: 'Academic',
          priority: 'HIGH',
          date: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
          link: '/academic/backlogs'
        });
      }
    }

    // Check Goals nearing deadline
    const goals = await repositories.goals.getGoals();
    const activeGoals = goals.filter(g => g.status === 'In Progress' && g.deadline);
    for (const goal of activeGoals) {
      const daysLeft = (new Date(goal.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft >= 0 && daysLeft <= 3) {
        const title = `Goal Deadline Approaching`;
        const message = `Goal "${goal.title}" is due in ${Math.ceil(daysLeft)} days.`;
        if (!existing.some(n => n.title === title && n.message === message)) {
          newNotifications.push({
            id: uuidv4(),
            title,
            message,
            category: 'Goal',
            priority: 'HIGH',
            date: new Date().toISOString(),
            isRead: false,
            isDismissed: false,
            link: '/goals'
          });
        }
      }
    }

    // Save new notifications
    for (const notification of newNotifications) {
      await repositories.notifications.saveNotification(notification);
    }
  }
}

export const notificationEngine = new LocalNotificationEngine();
