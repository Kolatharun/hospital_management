import { create } from 'zustand';
import { LiveQueueState } from '../types';

interface QueueStoreState {
  activeQueue: LiveQueueState | null;
  tokenCalledAlertAcknowledged: boolean;
  setActiveQueue: (queue: LiveQueueState | null) => void;
  acknowledgeTokenAlert: () => void;
  resetTokenAlert: () => void;
}

export const useQueueStore = create<QueueStoreState>((set) => ({
  activeQueue: null,
  tokenCalledAlertAcknowledged: false,

  setActiveQueue: (activeQueue) => set({ activeQueue }),
  acknowledgeTokenAlert: () => set({ tokenCalledAlertAcknowledged: true }),
  resetTokenAlert: () => set({ tokenCalledAlertAcknowledged: false }),
}));
