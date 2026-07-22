import { LiveQueueState } from '../types';

export const mockQueueState: LiveQueueState = {
  appointmentId: 'apt-501',
  myToken: 'B-14',
  currentServingToken: 'B-11',
  patientsAhead: 2,
  estimatedWaitMinutes: 18,
  doctorName: 'Dr. Ananya Rao',
  roomNumber: 'OPD Room 104',
  status: 'waiting',
  lastUpdated: 'Just now',
};
