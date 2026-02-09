/**
 * Department Service - API calls for departments and doctors
 */

import api from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  base_consultation_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  department_id?: string;
  department_name?: string;
  speciality?: string;
  qualification?: string;
  registration_number?: string;
  phone?: string;
  email?: string;
  room?: string;
  consultation_fee?: number;
  effective_fee: number;
  is_available: boolean;
  created_at: string;
}

export interface DoctorsByDepartment {
  department_id: string;
  department_name: string;
  doctors: Doctor[];
}

export const departmentService = {
  // Departments
  async getDepartments(): Promise<Department[]> {
    return api.get<Department[]>('/departments');
  },

  async getDepartmentById(departmentId: string): Promise<Department> {
    return api.get<Department>(`/departments/${departmentId}`);
  },

  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    return api.get<Doctor[]>('/doctors');
  },

  async getDoctorById(doctorId: string): Promise<Doctor> {
    return api.get<Doctor>(`/doctors/${doctorId}`);
  },

  async getDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
    return api.get<Doctor[]>(`/doctors/department/${departmentId}`);
  },

  async getDoctorsGrouped(): Promise<DoctorsByDepartment[]> {
    return api.get<DoctorsByDepartment[]>('/doctors/grouped');
  },
};

export default departmentService;
