/**
 * Vitals Service - API calls for patient vitals
 */

import api from './api';

export interface Vitals {
  id: string;
  appointment_id: string;
  patient_id: string;
  recorded_by?: string;
  pulse: number;
  blood_pressure: string;
  spo2?: number;
  cvs?: string;
  rs?: string;
  jvp?: string;
  weight?: number;
  hlp?: string;
  htn?: string;
  dm?: string;
  smoking?: string;
  family_ho_cad?: string;
  heart_disease?: string;
  ptca_cabg?: string;
  current_drugs?: string;
  spo2_status?: string;
  systolic?: number;
  diastolic?: number;
  patient_name?: string;
  patient_mr_number?: string;
  op_number?: string;
  recorded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VitalsCreate {
  appointment_id: string;
  pulse: number;
  blood_pressure: string;
  spo2?: number;
  cvs?: string;
  rs?: string;
  jvp?: string;
  weight?: number;
  hlp?: string;
  htn?: string;
  dm?: string;
  smoking?: string;
  family_ho_cad?: string;
  heart_disease?: string;
  ptca_cabg?: string;
  current_drugs?: string;
}

export const vitalsService = {
  async record(data: VitalsCreate): Promise<Vitals> {
    return api.post<Vitals>('/vitals', data);
  },

  async getById(vitalsId: string): Promise<Vitals> {
    return api.get<Vitals>(`/vitals/${vitalsId}`);
  },

  async getByAppointment(appointmentId: string): Promise<Vitals> {
    return api.get<Vitals>(`/vitals/appointment/${appointmentId}`);
  },

  async getPatientHistory(patientId: string, skip = 0, limit = 20): Promise<Vitals[]> {
    return api.get<Vitals[]>(`/vitals/patient/${patientId}?skip=${skip}&limit=${limit}`);
  },

  async getTodayVitals(): Promise<Vitals[]> {
    return api.get<Vitals[]>('/vitals/today');
  },

  async update(vitalsId: string, data: Partial<VitalsCreate>): Promise<Vitals> {
    return api.put<Vitals>(`/vitals/${vitalsId}`, data);
  },
};

export default vitalsService;
