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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const getPrescriptionPdfUrl = (prescriptionId: string, download = false): string => {
  if (!prescriptionId) return '';
  const token = localStorage.getItem('access_token');
  const baseUrl = `${API_BASE_URL}/prescriptions/${prescriptionId}/download-pdf`;
  const params = new URLSearchParams();
  if (token) params.append('token', token);
  if (download) params.append('download', 'true');
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

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

  async getPatientPrescriptions(
    patientId: string,
    skip = 0,
    limit = 20,
    excludeAppointmentId?: string
  ): Promise<Prescription[]> {
    let url = `/prescriptions/patient/${patientId}?skip=${skip}&limit=${limit}`;
    if (excludeAppointmentId) {
      url += `&exclude_appointment_id=${excludeAppointmentId}`;
    }
    return api.get<Prescription[]>(url);
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

  async generatePdf(prescriptionId: string): Promise<{ message: string; pdf_path: string }> {
    return api.post(`/prescriptions/${prescriptionId}/generate-pdf`);
  },

  async downloadPdf(prescriptionId: string): Promise<Blob> {
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${baseUrl}/prescriptions/${prescriptionId}/download-pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download prescription PDF');
    }
    return response.blob();
  },

  async sendEmail(prescriptionId: string, email: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-email`, { email });
  },

  async sendWhatsApp(prescriptionId: string, phone: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-whatsapp`, { phone });
  },

  async sendToLabEmail(prescriptionId: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-lab-email`);
  },

  async sendToLabWhatsApp(prescriptionId: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-lab-whatsapp`);
  },

  async sendToPharmacyEmail(prescriptionId: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-pharmacy-email`);
  },

  async sendToPharmacyWhatsApp(prescriptionId: string): Promise<{ message: string }> {
    return api.post(`/prescriptions/${prescriptionId}/send-to-pharmacy-whatsapp`);
  },
};

export default prescriptionService;
