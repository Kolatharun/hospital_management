export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface SecureDocument {
  id: string;
  title: string;
  category: 'prescription' | 'lab_report' | 'visit_summary';
  mrNumber: string;
  patientName: string;
  issueDate: string;
  fileType: 'pdf' | 'image';
  pageCount: number;
  url: string; // Blob or mock URL
  isOfflineAvailable: boolean;
  status: 'idle' | 'loading' | 'available' | 'saved_offline' | 'unavailable' | 'access_denied' | 'expired' | 'corrupted';
}
