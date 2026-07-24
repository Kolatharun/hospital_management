export interface EmergencyContactInfo {
  nationalEmergencyNumber: string;
  hospitalHotline: string;
  erDepartmentDirect: string;
  ambulanceDispatchDirect: string;
}

export type EmergencyAlertStatus = 'initiated' | 'received' | 'er_notified' | 'ambulance_dispatched' | 'failed';

export interface EmergencyAlertRequest {
  patientId: string;
  patientName: string;
  relation: string;
  requestorMobile: string;
  location?: {
    latitude?: number;
    longitude?: number;
    addressText?: string;
  };
  notes?: string;
}

export interface EmergencyAlertResponse {
  alertId: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  status: EmergencyAlertStatus;
  estimatedArrivalMinutes?: number;
  assignedDoctorOrERTeam?: string;
  hotlineFallback: string;
  message: string;
}
