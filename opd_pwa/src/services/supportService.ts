import { simulateLatency } from './apiClient';
import { SupportIssueFormData } from '../schemas/supportSchemas';

export interface SupportTicket {
  id: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

const mockTickets: SupportTicket[] = [
  {
    id: 'TICK-402',
    category: 'appointment_issue',
    description: 'Unable to select time slot for review consultation.',
    status: 'resolved',
    createdAt: '2026-07-10T11:00:00Z',
  },
];

export const supportService = {
  submitIssue: async (data: SupportIssueFormData) => {
    const newTicket: SupportTicket = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      category: data.category,
      description: data.description,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    mockTickets.unshift(newTicket);
    return simulateLatency(newTicket, 500);
  },

  getRequests: async () => {
    return simulateLatency(mockTickets, 300);
  },
};
