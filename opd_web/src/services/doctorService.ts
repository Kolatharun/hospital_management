/**
 * Doctor Service - API calls for doctor dashboard
 */

import api from './api';
import { Appointment, QueueStats } from './appointmentService';
import { Vitals } from './vitalsService';
import { Prescription } from './prescriptionService';
import { Patient } from './patientService';

export interface DoctorProfile {
  id: string;
  name: string;
  qualification: string | null;
  registration_number: string | null;
  speciality: string | null;
  phone: string | null;
  email: string | null;
}

export interface PatientHistory {
  patient: Patient;
  vitals: Vitals[];
  prescriptions: Prescription[];
  appointments: Appointment[];
}

export interface TodaySummary {
  queue: QueueStats;
  prescriptions_count: number;
  patients_seen: number;
  patients_waiting: number;
  current_in_progress: number;
}

export const doctorService = {
  async getMyProfile(): Promise<DoctorProfile> {
    return api.get<DoctorProfile>('/doctor/profile');
  },

  async getMyQueue(): Promise<Appointment[]> {
    return api.get<Appointment[]>('/doctor/queue');
  },

  async getMyQueueStats(): Promise<QueueStats> {
    return api.get<QueueStats>('/doctor/queue/stats');
  },

  async getCurrentPatient(): Promise<Appointment | null> {
    return api.get<Appointment | null>('/doctor/current-patient');
  },

  async callNextPatient(): Promise<Appointment> {
    return api.post<Appointment>('/doctor/call-next');
  },

  async getPatientHistory(patientId: string): Promise<PatientHistory> {
    return api.get<PatientHistory>(`/doctor/patient/${patientId}/history`);
  },

  async getMyTodayAppointments(): Promise<Appointment[]> {
    return api.get<Appointment[]>('/doctor/today/appointments');
  },

  async getMyTodayPrescriptions(): Promise<Prescription[]> {
    return api.get<Prescription[]>('/doctor/today/prescriptions');
  },

  async getTodaySummary(): Promise<TodaySummary> {
    return api.get<TodaySummary>('/doctor/today/summary');
  },
};

export default doctorService;
