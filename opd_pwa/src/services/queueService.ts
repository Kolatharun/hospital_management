import { simulateLatency } from './apiClient';
import { mockQueueState } from '../mocks/queue';
import { LiveQueueState } from '../types';

let localQueueState: LiveQueueState = { ...mockQueueState };

export const queueService = {
  getQueueState: async (appointmentId: string) => {
    return simulateLatency({ ...localQueueState, appointmentId }, 300);
  },

  requestRecovery: async (appointmentId: string) => {
    localQueueState = {
      ...localQueueState,
      appointmentId,
      status: 'waiting',
      recoveryRequested: true,
      patientsAhead: 1,
      estimatedWaitMinutes: 10,
    };
    return simulateLatency(localQueueState, 500);
  },
};
