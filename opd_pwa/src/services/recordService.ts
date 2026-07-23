import { simulateLatency } from './apiClient';
import { mockVisits, mockLabReports } from '../mocks/records';

export const recordService = {
  getVisits: async () => {
    return simulateLatency(mockVisits, 400);
  },

  getVisitById: async (visitId: string) => {
    const visit = mockVisits.find((v) => v.id === visitId);
    if (!visit) {
      return { success: false, data: null, message: 'Visit record not found' };
    }
    return simulateLatency(visit, 300);
  },

  getLabReports: async () => {
    return simulateLatency(mockLabReports, 400);
  },

  getLabReportById: async (reportId: string) => {
    const report = mockLabReports.find((r) => r.id === reportId);
    if (!report) {
      return { success: false, data: null, message: 'Lab report not found' };
    }
    return simulateLatency(report, 300);
  },
};
