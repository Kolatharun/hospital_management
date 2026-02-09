/**
 * Patient Service - API calls for patient management
 */

import api from './api';

export interface Patient {
  id: string;
  mr_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender: string;
  marital_status?: string;
  patient_type?: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  blood_group?: string;
  full_name?: string;
  age?: number;
  age_gender?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender: string;
  marital_status?: string;
  patient_type?: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  blood_group?: string;
  doctor_id?: string;
}

export interface PatientSearchResponse {
  patients: Patient[];
  total: number;
  skip: number;
  limit: number;
}

export const patientService = {
  async register(data: PatientCreate): Promise<Patient> {
    return api.post<Patient>('/patients', data);
  },

  async search(query: string, searchType = 'all', skip = 0, limit = 20): Promise<PatientSearchResponse> {
    return api.get<PatientSearchResponse>(
      `/patients/search?q=${encodeURIComponent(query)}&search_type=${searchType}&skip=${skip}&limit=${limit}`
    );
  },

  async getById(patientId: string): Promise<Patient> {
    return api.get<Patient>(`/patients/${patientId}`);
  },

  async getByMrNumber(mrNumber: string): Promise<Patient> {
    return api.get<Patient>(`/patients/mr/${mrNumber}`);
  },

  async update(patientId: string, data: Partial<PatientCreate>): Promise<Patient> {
    return api.put<Patient>(`/patients/${patientId}`, data);
  },

  async getTodayRegistrations(): Promise<Patient[]> {
    return api.get<Patient[]>('/patients/today');
  },

  async getRecentRegistrations(days = 7): Promise<Patient[]> {
    return api.get<Patient[]>(`/patients/recent?days=${days}`);
  },
};

export default patientService;
