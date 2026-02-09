/**
 * Queue Service - API calls for Lab and Pharmacy queues
 */

import api from './api';

export interface LabQueueItem {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  mr_number: string;
  op_number: string;
  token_number: number;
  lab_tests: string[];
  status: string;
  collected_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface LabQueueCreate {
  appointment_id: string;
  lab_tests: string[];
  notes?: string;
}

export interface PharmacyQueueItem {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  mr_number: string;
  op_number: string;
  token_number: number;
  medicines: string[];
  status: string;
  dispensed_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface PharmacyQueueCreate {
  appointment_id: string;
  medicines: string[];
  notes?: string;
}

export const queueService = {
  // Lab Queue
  async addToLabQueue(data: LabQueueCreate): Promise<LabQueueItem> {
    return api.post<LabQueueItem>('/lab-queue', data);
  },

  async getLabQueue(): Promise<LabQueueItem[]> {
    return api.get<LabQueueItem[]>('/lab-queue');
  },

  async getPendingLabQueue(): Promise<LabQueueItem[]> {
    return api.get<LabQueueItem[]>('/lab-queue/pending');
  },

  async getLabQueueByAppointment(appointmentId: string): Promise<LabQueueItem> {
    return api.get<LabQueueItem>(`/lab-queue/appointment/${appointmentId}`);
  },

  async startLabProcessing(itemId: string): Promise<LabQueueItem> {
    return api.post<LabQueueItem>(`/lab-queue/${itemId}/start`);
  },

  async completeLabItem(itemId: string): Promise<LabQueueItem> {
    return api.post<LabQueueItem>(`/lab-queue/${itemId}/complete`);
  },

  async cancelLabItem(itemId: string): Promise<LabQueueItem> {
    return api.post<LabQueueItem>(`/lab-queue/${itemId}/cancel`);
  },

  // Pharmacy Queue
  async addToPharmacyQueue(data: PharmacyQueueCreate): Promise<PharmacyQueueItem> {
    return api.post<PharmacyQueueItem>('/pharmacy-queue', data);
  },

  async getPharmacyQueue(): Promise<PharmacyQueueItem[]> {
    return api.get<PharmacyQueueItem[]>('/pharmacy-queue');
  },

  async getPendingPharmacyQueue(): Promise<PharmacyQueueItem[]> {
    return api.get<PharmacyQueueItem[]>('/pharmacy-queue/pending');
  },

  async getPharmacyQueueByAppointment(appointmentId: string): Promise<PharmacyQueueItem> {
    return api.get<PharmacyQueueItem>(`/pharmacy-queue/appointment/${appointmentId}`);
  },

  async startPharmacyProcessing(itemId: string): Promise<PharmacyQueueItem> {
    return api.post<PharmacyQueueItem>(`/pharmacy-queue/${itemId}/start`);
  },

  async completePharmacyItem(itemId: string): Promise<PharmacyQueueItem> {
    return api.post<PharmacyQueueItem>(`/pharmacy-queue/${itemId}/complete`);
  },

  async cancelPharmacyItem(itemId: string): Promise<PharmacyQueueItem> {
    return api.post<PharmacyQueueItem>(`/pharmacy-queue/${itemId}/cancel`);
  },
};

export default queueService;
