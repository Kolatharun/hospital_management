export type AppointmentState =
  | 'confirmed'
  | 'check_in_available'
  | 'checked_in'
  | 'waiting'
  | 'calling'
  | 'in_progress'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'doctor_cancelled'
  | 'missed';

export interface Appointment {
  id: string;
  opNumber: string;
  patientId: string;
  mrNumber: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  doctorRoom: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  type: 'new' | 'review';
  status: AppointmentState;
  tokenNumber?: string;
  checkInTime?: string;
  rescheduleReason?: string;
  cancelReason?: string;
  createdAt: string;
}
