import { AppointmentState, PharmacyRequestState } from '../types';

export interface StatusStyle {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const getAppointmentStatusStyle = (status: AppointmentState): StatusStyle => {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', variant: 'info' };
    case 'check_in_available':
      return { label: 'Check-in Open', variant: 'warning' };
    case 'checked_in':
      return { label: 'Checked In', variant: 'success' };
    case 'waiting':
      return { label: 'In Queue', variant: 'warning' };
    case 'calling':
      return { label: 'Doctor Calling', variant: 'warning' };
    case 'in_progress':
      return { label: 'In Consultation', variant: 'info' };
    case 'completed':
      return { label: 'Completed', variant: 'success' };
    case 'rescheduled':
      return { label: 'Rescheduled', variant: 'neutral' };
    case 'cancelled':
    case 'doctor_cancelled':
      return { label: 'Cancelled', variant: 'error' };
    case 'missed':
      return { label: 'Missed Turn', variant: 'error' };
    default:
      return { label: status, variant: 'neutral' };
  }
};

export const getPharmacyStatusStyle = (status: PharmacyRequestState): StatusStyle => {
  switch (status) {
    case 'draft':
    case 'consent_required':
      return { label: 'Action Needed', variant: 'warning' };
    case 'sending':
    case 'sent':
    case 'received':
    case 'reviewing':
      return { label: 'Processing', variant: 'info' };
    case 'ready':
      return { label: 'Ready for Pickup/Delivery', variant: 'success' };
    case 'partially_available':
      return { label: 'Partially Available', variant: 'warning' };
    case 'unavailable':
    case 'failed':
      return { label: 'Unavailable', variant: 'error' };
    case 'completed':
      return { label: 'Fulfilled', variant: 'success' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'neutral' };
    default:
      return { label: status, variant: 'neutral' };
  }
};
