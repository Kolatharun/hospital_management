import { simulateLatency } from './apiClient';
import { mockNotifications } from '../mocks/notifications';
import { NotificationPreferences } from '../types';

let localNotifications = [...mockNotifications];

export const notificationService = {
  getNotifications: async () => {
    return simulateLatency(localNotifications, 300);
  },

  markAsRead: async (id: string) => {
    const idx = localNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      localNotifications[idx] = { ...localNotifications[idx], isRead: true };
    }
    return simulateLatency({ success: true }, 200);
  },

  getPreferences: async (): Promise<{ success: boolean; data: NotificationPreferences }> => {
    return simulateLatency(
      {
        devicePermission: true,
        appointmentReminders: true,
        queueAlerts: true,
        tokenCalledAlerts: true,
        prescriptionAvailable: true,
        labReportAvailable: true,
        followUpReminders: true,
        pharmacyStatusUpdates: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      },
      300
    );
  },
};
