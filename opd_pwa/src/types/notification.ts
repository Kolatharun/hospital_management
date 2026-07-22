export type NotificationCategory = 'appointment' | 'queue' | 'prescription' | 'pharmacy' | 'system';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority?: 'high' | 'normal';
}

export interface NotificationPreferences {
  devicePermission: boolean;
  appointmentReminders: boolean;
  queueAlerts: boolean;
  tokenCalledAlerts: boolean;
  prescriptionAvailable: boolean;
  labReportAvailable: boolean;
  followUpReminders: boolean;
  pharmacyStatusUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}
