/**
 * Appointment Service - API calls for appointment management
 */

import api from './api';

export interface Appointment {
  id: string;
  op_number: string;
  patient_id: string;
  doctor_id?: string;
  appointment_date: string;
  appointment_time?: string;
  token_number: number;
  status: string;
  queue_type: string;
  room?: string;
  waiting_time_minutes?: number;
  called_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  patient_name?: string;
  patient_mr_number?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age_gender?: string;
  doctor_name?: string;
}

export interface AppointmentCreate {
  patient_id: string;
  doctor_id?: string;
  appointment_date: string;
  appointment_time?: string;
  room?: string;
  notes?: string;
}

export interface QueueStats {
  waiting: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  lab_queue: number;
  pharmacy_queue: number;
  total_today: number;
}

export interface QueueDisplayData {
  current_patient?: {
    op_number: string;
    patient_name: string;
    mr_number: string;
    room?: string;
    doctor_name?: string;
  };
  waiting_queue: {
    op_number: string;
    patient_name: string;
    mr_number: string;
    waiting_time_minutes: number;
    token_number: number;
  }[];
  stats: QueueStats;
}

export const appointmentService = {
  async create(data: AppointmentCreate): Promise<Appointment> {
    return api.post<Appointment>('/appointments', data);
  },

  async getById(appointmentId: string): Promise<Appointment> {
    return api.get<Appointment>(`/appointments/${appointmentId}`);
  },

  async getByOpNumber(opNumber: string): Promise<Appointment> {
    return api.get<Appointment>(`/appointments/op/${opNumber}`);
  },

  async getTodayAppointments(doctorId?: string, status?: string): Promise<Appointment[]> {
    let url = '/appointments/today';
    const params: string[] = [];
    if (doctorId) params.push(`doctor_id=${doctorId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return api.get<Appointment[]>(url);
  },

  async getAppointmentsByDate(date: string, doctorId?: string): Promise<Appointment[]> {
    let url = `/appointments/by-date?date=${date}`;
    if (doctorId) url += `&doctor_id=${doctorId}`;
    return api.get<Appointment[]>(url);
  },

  async getPatientAppointments(patientId: string, skip = 0, limit = 20): Promise<Appointment[]> {
    return api.get<Appointment[]>(`/appointments/patient/${patientId}?skip=${skip}&limit=${limit}`);
  },

  async getQueueStats(): Promise<QueueStats> {
    return api.get<QueueStats>('/appointments/queue/stats');
  },

  async getQueueDisplay(doctorId?: string): Promise<QueueDisplayData> {
    const url = doctorId ? `/appointments/queue/display?doctor_id=${doctorId}` : '/appointments/queue/display';
    return api.get<QueueDisplayData>(url);
  },

  async getWaitingQueue(doctorId?: string): Promise<Appointment[]> {
    const url = doctorId ? `/appointments/queue/waiting?doctor_id=${doctorId}` : '/appointments/queue/waiting';
    return api.get<Appointment[]>(url);
  },

  async callPatient(appointmentId: string): Promise<Appointment> {
    return api.post<Appointment>(`/appointments/${appointmentId}/call`);
  },

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    return api.post<Appointment>(`/appointments/${appointmentId}/complete`);
  },

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return api.post<Appointment>(`/appointments/${appointmentId}/cancel`);
  },

  async addBufferTime(appointmentId: string, minutes: number): Promise<Appointment> {
    return api.post<Appointment>(`/appointments/${appointmentId}/buffer?minutes=${minutes}`);
  },
};

export default appointmentService;
