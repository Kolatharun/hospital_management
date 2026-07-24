import { simulateLatency } from './apiClient';
import { EmergencyAlertRequest, EmergencyAlertResponse, EmergencyContactInfo } from '../types';

export const HOSPITAL_EMERGENCY_CONFIG: EmergencyContactInfo = {
  nationalEmergencyNumber: '112',
  hospitalHotline: '+918001234567',
  erDepartmentDirect: '+912225009999',
  ambulanceDispatchDirect: '+918001239999',
};

export const emergencyService = {
  getEmergencyContacts: async (): Promise<EmergencyContactInfo> => {
    return HOSPITAL_EMERGENCY_CONFIG;
  },

  sendEmergencyAlert: async (request: EmergencyAlertRequest): Promise<EmergencyAlertResponse> => {
    // Check network connectivity first
    if (!navigator.onLine) {
      return {
        alertId: `EMG-OFFLINE-${Date.now()}`,
        patientId: request.patientId,
        patientName: request.patientName,
        timestamp: new Date().toISOString(),
        status: 'failed',
        hotlineFallback: HOSPITAL_EMERGENCY_CONFIG.hospitalHotline,
        message: 'Application is offline. Please call Emergency Services (112) or Hospital Hotline directly.',
      };
    }

    const mockResponse: EmergencyAlertResponse = {
      alertId: `EMG-ALERT-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: request.patientId,
      patientName: request.patientName,
      timestamp: new Date().toISOString(),
      status: 'received',
      estimatedArrivalMinutes: 12,
      assignedDoctorOrERTeam: 'ER Triage Team Alpha (Balaji Heart Center)',
      hotlineFallback: HOSPITAL_EMERGENCY_CONFIG.hospitalHotline,
      message: `Emergency alert received for ${request.patientName}. ER Desk at Balaji Heart Center has been notified.`,
    };

    const result = await simulateLatency(mockResponse, 800);
    return result.data;
  },
};
