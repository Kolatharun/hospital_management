import { simulateLatency } from './apiClient';
import { SecureDocument } from '../types';

export const documentService = {
  getDocumentById: async (id: string) => {
    const doc: SecureDocument = {
      id,
      title: 'Prescription & Medical Advice - OP-2026-09120',
      category: 'prescription',
      mrNumber: 'MR-2026-8842',
      patientName: 'Rajesh K. Sharma',
      issueDate: '15 June 2026',
      fileType: 'pdf',
      pageCount: 2,
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isOfflineAvailable: true,
      status: 'available',
    };
    return simulateLatency(doc, 400);
  },
};
