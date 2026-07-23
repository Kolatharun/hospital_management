export type QueueStateStatus =
  | 'checked_in'
  | 'waiting'
  | 'one_ahead'
  | 'calling'
  | 'in_consultation'
  | 'completed'
  | 'missed';

export interface LiveQueueState {
  appointmentId: string;
  myToken: string;
  currentServingToken: string;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  doctorName: string;
  roomNumber: string;
  status: QueueStateStatus;
  lastUpdated: string;
  recoveryRequested?: boolean;
}
