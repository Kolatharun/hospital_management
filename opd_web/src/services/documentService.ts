/**
 * Document Service - API calls for patient document management
 */

import api from './api';

export interface Document {
  id: string;
  patient_id: string;
  appointment_id?: string;
  uploaded_by?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file_size_formatted?: string;
  document_type: string;
  description?: string;
  patient_name?: string;
  patient_mr_number?: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  patient_id: string;
  appointment_id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  description?: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
}

export interface TodayDocumentsResponse {
  items: Document[];
  total: number;
}

export const documentService = {
  async create(data: DocumentCreate): Promise<Document> {
    return api.post<Document>('/documents', data);
  },

  async upload(
    file: File,
    patientId: string,
    documentType: string,
    appointmentId?: string,
    description?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('document_type', documentType);
    if (appointmentId) {
      formData.append('appointment_id', appointmentId);
    }
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  async getById(documentId: string): Promise<Document> {
    return api.get<Document>(`/documents/${documentId}`);
  },

  async getPatientDocuments(patientId: string, skip = 0, limit = 50): Promise<DocumentListResponse> {
    return api.get<DocumentListResponse>(`/documents/patient/${patientId}?skip=${skip}&limit=${limit}`);
  },

  async getAppointmentDocuments(appointmentId: string): Promise<Document[]> {
    return api.get<Document[]>(`/documents/appointment/${appointmentId}`);
  },

  async getTodayDocuments(): Promise<TodayDocumentsResponse> {
    return api.get<TodayDocumentsResponse>('/documents/today');
  },

  async update(documentId: string, data: { document_type?: string; description?: string }): Promise<Document> {
    return api.put<Document>(`/documents/${documentId}`, data);
  },

  async delete(documentId: string): Promise<void> {
    return api.delete(`/documents/${documentId}`);
  },
};

export default documentService;
