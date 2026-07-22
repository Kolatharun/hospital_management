/**
 * Admin Service - API calls for admin module
 * Handles departments, doctors, users, and medicines management
 */

import api from './api';

// ============================================================
// Type Definitions
// ============================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  base_consultation_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentCreate {
  name: string;
  code: string;
  description?: string;
  base_consultation_fee?: number;
}

export interface DepartmentUpdate {
  name?: string;
  code?: string;
  description?: string;
  base_consultation_fee?: number;
  is_active?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  registration_number: string | null;
  qualification: string | null;
  speciality: string | null;
  consultation_fee: number | null;
  department_id: string | null;
  department_name: string | null;
  room: string | null;
  phone?: string | null;
  email?: string | null;
  is_available: boolean;
  user_id: string | null;
  created_at: string;
}

export interface DoctorCreate {
  name: string;
  speciality?: string;
  qualification?: string;
  registration_number?: string;
  phone?: string;
  email?: string;
  room?: string;
  consultation_fee?: number;
  department_id?: string;
  user_id?: string;
}

export interface DoctorUpdate {
  name?: string;
  department_id?: string | null;
  speciality?: string;
  qualification?: string;
  registration_number?: string;
  phone?: string;
  email?: string;
  room?: string;
  consultation_fee?: number | null;
  is_available?: boolean;
  user_id?: string | null;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: 'admin' | 'front-office' | 'doctor';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface UserCreate {
  username: string;
  password: string;
  display_name: string;
  email?: string;
  role: 'admin' | 'front-office' | 'doctor';
}

export interface UserUpdate {
  display_name?: string;
  email?: string;
  is_active?: boolean;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  specialization: string | null;
  dosage_form: string | null;
  strength: string | null;
  manufacturer: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicineCreate {
  code: string;
  name: string;
  generic_name?: string;
  category?: string;
  specialization?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
}

export interface MedicineUpdate {
  code?: string;
  name?: string;
  generic_name?: string;
  category?: string;
  specialization?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_active?: boolean;
}

// CSV Upload Types
export interface CSVMedicineRow {
  row_number: number;
  code: string;
  category: string;
  name: string;
  generic_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  manufacturer: string | null;
  is_valid: boolean;
  error_message: string | null;
}

export interface CSVParseResponse {
  success: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  preview: CSVMedicineRow[];
  errors: string[];
}

export interface BulkSaveResponse {
  success: boolean;
  inserted: number;
  message: string | null;
}

export interface ClearBySpecializationResponse {
  success: boolean;
  deleted: number;
  specialization: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface MessageResponse {
  message: string;
}

// ============================================================
// Department API
// ============================================================

export const adminDepartmentService = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Department>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return api.get<PaginatedResponse<Department>>(`/admin/departments${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<Department> {
    return api.get<Department>(`/admin/departments/${id}`);
  },

  async create(data: DepartmentCreate): Promise<Department> {
    return api.post<Department>('/admin/departments', data);
  },

  async update(id: string, data: DepartmentUpdate): Promise<Department> {
    return api.patch<Department>(`/admin/departments/${id}`, data);
  },

  async delete(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/admin/departments/${id}`);
  },
};

// ============================================================
// Doctor API
// ============================================================

export const adminDoctorService = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    department_id?: string;
    is_available?: boolean;
  }): Promise<PaginatedResponse<Doctor>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    if (params?.is_available !== undefined) searchParams.set('is_available', params.is_available.toString());

    const query = searchParams.toString();
    return api.get<PaginatedResponse<Doctor>>(`/admin/doctors${query ? `?${query}` : ''}`);
  },

  async create(data: DoctorCreate): Promise<Doctor> {
    return api.post<Doctor>('/admin/doctors', data);
  },

  async update(id: string, data: DoctorUpdate): Promise<Doctor> {
    return api.patch<Doctor>(`/admin/doctors/${id}`, data);
  },

  async delete(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/admin/doctors/${id}`);
  },
};

// ============================================================
// User API
// ============================================================

export const adminUserService = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return api.get<PaginatedResponse<User>>(`/admin/users${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<User> {
    return api.get<User>(`/admin/users/${id}`);
  },

  async create(data: UserCreate): Promise<User> {
    return api.post<User>('/admin/users', data);
  },

  async update(id: string, data: UserUpdate): Promise<User> {
    return api.patch<User>(`/admin/users/${id}`, data);
  },

  async toggleStatus(id: string, is_active: boolean): Promise<User> {
    return api.post<User>(`/admin/users/${id}/toggle-status`, { is_active });
  },

  async delete(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/admin/users/${id}`);
  },

  async getUnlinkedDoctorUsers(): Promise<User[]> {
    return api.get<User[]>('/admin/users/unlinked-doctors');
  },

  async resetPassword(id: string, newPassword: string): Promise<MessageResponse> {
    return api.put<MessageResponse>(`/admin/users/${id}/reset-password`, { new_password: newPassword });
  },
};

// ============================================================
// Medicine API
// ============================================================

export const adminMedicineService = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    specialization?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Medicine>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.specialization) searchParams.set('specialization', params.specialization);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return api.get<PaginatedResponse<Medicine>>(`/admin/medicines${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<Medicine> {
    return api.get<Medicine>(`/admin/medicines/${id}`);
  },

  async create(data: MedicineCreate): Promise<Medicine> {
    return api.post<Medicine>('/admin/medicines', data);
  },

  async bulkCreate(medicines: MedicineCreate[]): Promise<MessageResponse> {
    return api.post<MessageResponse>('/admin/medicines/bulk', { medicines });
  },

  async update(id: string, data: MedicineUpdate): Promise<Medicine> {
    return api.patch<Medicine>(`/admin/medicines/${id}`, data);
  },

  async toggleStatus(id: string): Promise<Medicine> {
    return api.post<Medicine>(`/admin/medicines/${id}/toggle-status`);
  },

  async delete(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/admin/medicines/${id}`);
  },

  async getCategories(specialization?: string): Promise<string[]> {
    const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : '';
    return api.get<string[]>(`/admin/master/categories${query}`);
  },

  async getSpecializations(): Promise<string[]> {
    return api.get<string[]>('/admin/master/specializations');
  },

  /**
   * Parse CSV content and return preview without inserting to database.
   * Frontend should display this preview and only call bulkSave when user clicks Save.
   */
  async parseCSV(csvContent: string, specialization: string): Promise<CSVParseResponse> {
    return api.post<CSVParseResponse>('/admin/medicines/csv/parse', {
      csv_content: csvContent,
      specialization,
    });
  },

  /**
   * Bulk save parsed medicines to database with transaction.
   * If any row fails, entire transaction is rolled back.
   */
  async bulkSave(medicines: MedicineCreate[], specialization: string): Promise<BulkSaveResponse> {
    return api.post<BulkSaveResponse>('/admin/medicines/csv/save', {
      medicines,
      specialization,
    });
  },

  /**
   * Clear all medicines for a specific specialization.
   * Uses soft delete for data integrity.
   */
  async clearBySpecialization(specialization: string): Promise<ClearBySpecializationResponse> {
    return api.delete<ClearBySpecializationResponse>(
      `/admin/medicines/clear?specialization=${encodeURIComponent(specialization)}`
    );
  },
};

export default {
  departments: adminDepartmentService,
  doctors: adminDoctorService,
  users: adminUserService,
  medicines: adminMedicineService,
};
