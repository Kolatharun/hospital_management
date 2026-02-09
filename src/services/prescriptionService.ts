/**
 * Prescription Service - API calls for prescription management
 */

import api from './api';

export interface Medicine {
  id?: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  sequence_order?: number;
}

export interface Prescription {
  id: string;
  patient_id: string;
  appointment_id: string;
  doctor_id?: string;
  diagnosis: string;
  complaint?: string;
  history?: string;
  lab_tests?: string;
  advice?: string;
  notes?: string;
  follow_up_days?: number;
  sent_to_patient: boolean;
  sent_via?: string;
  medicines: Medicine[];
  patient_name?: string;
  patient_mr_number?: string;
  patient_age_gender?: string;
  doctor_name?: string;
  op_number?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionCreate {
  appointment_id: string;
  diagnosis: string;
  complaint?: string;
  history?: string;
  lab_tests?: string;
  advice?: string;
  notes?: string;
  follow_up_days?: number;
  medicines: Omit<Medicine, 'id' | 'sequence_order'>[];
}

export interface PrescriptionUpdate {
  diagnosis?: string;
  complaint?: string;
  history?: string;
  lab_tests?: string;
  advice?: string;
  notes?: string;
  follow_up_days?: number;
  medicines?: Omit<Medicine, 'id' | 'sequence_order'>[];
}

export const prescriptionService = {
  async create(data: PrescriptionCreate): Promise<Prescription> {
    return api.post<Prescription>('/prescriptions', data);
  },

  async getById(prescriptionId: string): Promise<Prescription> {
    return api.get<Prescription>(`/prescriptions/${prescriptionId}`);
  },

  async getByAppointment(appointmentId: string): Promise<Prescription> {
    return api.get<Prescription>(`/prescriptions/appointment/${appointmentId}`);
  },

  async getPatientPrescriptions(patientId: string, skip = 0, limit = 20): Promise<Prescription[]> {
    return api.get<Prescription[]>(`/prescriptions/patient/${patientId}?skip=${skip}&limit=${limit}`);
  },

  async getTodayPrescriptions(): Promise<Prescription[]> {
    return api.get<Prescription[]>('/prescriptions/today');
  },

  async getMyPrescriptions(date?: string, skip = 0, limit = 50): Promise<Prescription[]> {
    let url = `/prescriptions/my?skip=${skip}&limit=${limit}`;
    if (date) url += `&target_date=${date}`;
    return api.get<Prescription[]>(url);
  },

  async update(prescriptionId: string, data: PrescriptionUpdate): Promise<Prescription> {
    return api.put<Prescription>(`/prescriptions/${prescriptionId}`, data);
  },

  async sendToLab(prescriptionId: string, labTests: string[]): Promise<{ message: string; tests: string[] }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-lab`, { lab_tests: labTests });
  },

  async sendToPharmacy(prescriptionId: string, medicines: string[]): Promise<{ message: string; medicines: string[] }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-pharmacy`, { medicines });
  },

  async sendToPatient(prescriptionId: string, method: 'whatsapp' | 'email'): Promise<Prescription> {
    return api.post<Prescription>(`/prescriptions/${prescriptionId}/send-to-patient`, { method });
  },
};

export default prescriptionService;
