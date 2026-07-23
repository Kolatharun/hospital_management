export const ROUTES = {
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  CREATE_PROFILE: '/create-profile',
  PROFILE_CREATED: '/profile-created',

  HOME: '/home',

  DOCTORS: '/doctors',
  DOCTOR_DETAILS: '/doctors/:doctorId',
  BOOK_DOCTOR: '/doctors/:doctorId/book',

  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAILS: '/appointments/:appointmentId',
  RESCHEDULE_APPOINTMENT: '/appointments/:appointmentId/reschedule',
  CHECK_IN: '/appointments/:appointmentId/check-in',

  LIVE_QUEUE: '/queue/:appointmentId',
  TOKEN_CALLED: '/queue/:appointmentId/called',
  MISSED_TOKEN: '/queue/:appointmentId/missed',

  RECORDS: '/records',
  VISIT_DETAILS: '/records/visits/:visitId',
  LAB_REPORTS: '/records/labs',
  LAB_REPORT_DETAILS: '/records/labs/:reportId',

  PRESCRIPTION_DETAILS: '/prescriptions/:prescriptionId',
  SEND_PHARMACY: '/prescriptions/:prescriptionId/pharmacy',
  PHARMACY_STATUS: '/pharmacy/requests/:requestId',

  DOCUMENT_VIEWER: '/documents/:documentId',

  NOTIFICATIONS: '/notifications',

  PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  CHANGE_MOBILE: '/profile/change-mobile',
  NOTIFICATION_PREFERENCES: '/profile/notifications',

  SUPPORT: '/support',
  REPORT_ISSUE: '/support/report-issue',

  OFFLINE: '/offline',
  SESSION_EXPIRED: '/session-expired',
  NOT_FOUND: '/not-found',
};
