import { AppNotification } from '../types';

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    category: 'queue',
    title: 'Check-in Open',
    body: 'Your check-in for appointment with Dr. Ananya Rao is now open.',
    timestamp: '10 mins ago',
    isRead: false,
    actionUrl: '/appointments/apt-501/check-in',
    priority: 'high',
  },
  {
    id: 'notif-2',
    category: 'pharmacy',
    title: 'Medicines Ready for Pickup',
    body: 'Prescription Rx-701 medicines are ready at Balaji Pharmacy Counter 2.',
    timestamp: '2 hours ago',
    isRead: true,
    actionUrl: '/pharmacy/requests/ph-req-901',
  },
  {
    id: 'notif-3',
    category: 'appointment',
    title: 'Appointment Reminder',
    body: 'You have an upcoming review consultation on 24 July at 10:30 AM.',
    timestamp: 'Yesterday',
    isRead: true,
    actionUrl: '/appointments/apt-501',
  },
];
