import { simulateLatency } from './apiClient';
import { mockPrescriptions } from '../mocks/prescriptions';

export const prescriptionService = {
  getPrescriptionById: async (id: string) => {
    const rx = mockPrescriptions.find((p) => p.id === id) || mockPrescriptions[0];
    return simulateLatency(rx, 300);
  },

  getLatestPrescription: async () => {
    return simulateLatency(mockPrescriptions[0], 300);
  },
};
