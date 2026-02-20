import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  adminDepartmentService,
  adminDoctorService,
  adminUserService,
  adminMedicineService,
  Department as APIDepartment,
  Doctor as APIDoctor,
  User as APIUser,
  Medicine as APIMedicine,
  DepartmentCreate,
  DoctorCreate,
  DoctorUpdate,
  UserCreate,
  MedicineCreate,
  CSVParseResponse,
  CSVMedicineRow,
  BulkSaveResponse,
  ClearBySpecializationResponse,
} from '@/services/adminService';
import { toast } from 'sonner';

// ============================================================
// Type Definitions (Frontend interfaces)
// ============================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  baseConsultationFee: number;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  speciality: string;
  qualification: string;
  registrationNumber: string;
  phone: string;
  email: string;
  room: string;
  consultationFee: number | null;
  departmentId: string | null;
  departmentName: string | null;
  userId: string | null;
  isAvailable: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'front-office' | 'doctor';
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  specialization: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  isActive: boolean;
}

export interface ClinicSettings {
  clinicName: string;
  logoUrl: string;
  headerCaption: string;
  footerCaption: string;
  tvDisplayTitle: string;
  tvDisplaySubtitle: string;
  prescriptionHeader: string;
  prescriptionFooter: string;
}

interface AdminContextType {
  // Data
  departments: Department[];
  doctors: Doctor[];
  staff: Staff[];
  medicines: Medicine[];
  settings: ClinicSettings;

  // Loading states
  loading: {
    departments: boolean;
    doctors: boolean;
    staff: boolean;
    medicines: boolean;
  };

  // Department operations
  fetchDepartments: () => Promise<void>;
  addDepartment: (department: Omit<Department, 'id' | 'isActive'>) => Promise<void>;
  updateDepartment: (id: string, department: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  // Doctor operations
  fetchDoctors: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'departmentName'>) => Promise<void>;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  // Staff operations
  fetchStaff: () => Promise<void>;
  addStaff: (staffMember: Omit<Staff, 'id'> & { password: string }) => Promise<void>;
  updateStaff: (id: string, staffMember: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  // Medicine operations
  fetchMedicines: () => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'isActive'>) => Promise<void>;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => Promise<void>;
  importMedicines: (medicines: Omit<Medicine, 'id' | 'isActive'>[]) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  clearMedicinesBySpecialization: (specialization: string) => Promise<ClearBySpecializationResponse>;

  // CSV Upload operations (preview flow)
  parseCSV: (csvContent: string, specialization: string) => Promise<CSVParseResponse>;
  bulkSaveMedicines: (medicines: Omit<Medicine, 'id' | 'isActive'>[], specialization: string) => Promise<BulkSaveResponse>;

  // Settings operations
  updateSettings: (settings: Partial<ClinicSettings>) => void;

  // Utility functions
  getMedicinesBySpecialization: (specialization: string) => Medicine[];
  getSpecializations: () => string[];
  getCategories: (specialization?: string) => string[];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Default settings (stored locally for now)
const defaultSettings: ClinicSettings = {
  clinicName: 'Balaji Heart Center',
  logoUrl: '',
  headerCaption: 'Excellence in Cardiac Care',
  footerCaption: '© 2025 Balaji Heart Center. All rights reserved.',
  tvDisplayTitle: 'ప్రస్తుతం సేవ',
  tvDisplaySubtitle: 'Now Serving',
  prescriptionHeader: 'Balaji Heart Center - Prescription',
  prescriptionFooter: 'Get well soon! Follow up as advised.',
};

// ============================================================
// Helper functions for data transformation
// ============================================================

function transformDepartment(dept: APIDepartment): Department {
  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    description: dept.description || '',
    baseConsultationFee: dept.base_consultation_fee,
    isActive: dept.is_active,
  };
}

function transformDoctor(doc: APIDoctor): Doctor {
  return {
    id: doc.id,
    name: doc.name,
    speciality: doc.speciality || '',
    qualification: doc.qualification || '',
    registrationNumber: doc.registration_number || '',
    phone: doc.phone || '',
    email: doc.email || '',
    room: doc.room || '',
    consultationFee: doc.consultation_fee,
    departmentId: doc.department_id,
    departmentName: doc.department_name,
    userId: doc.user_id,
    isAvailable: doc.is_available,
  };
}

function transformUser(user: APIUser): Staff {
  return {
    id: user.id,
    name: user.display_name,
    role: user.role,
    username: user.username,
    email: user.email || '',
    phone: '',
    isActive: user.is_active,
  };
}

function transformMedicine(med: APIMedicine): Medicine {
  return {
    id: med.id,
    code: med.code,
    name: med.name,
    genericName: med.generic_name || '',
    category: med.category || '',
    specialization: med.specialization || '',
    dosageForm: med.dosage_form || '',
    strength: med.strength || '',
    manufacturer: med.manufacturer || '',
    isActive: med.is_active,
  };
}

// ============================================================
// Provider Component
// ============================================================

export function AdminProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);

  const [loading, setLoading] = useState({
    departments: false,
    doctors: false,
    staff: false,
    medicines: false,
  });

  // ============================================================
  // Department Operations
  // ============================================================

  const fetchDepartments = useCallback(async () => {
    setLoading(prev => ({ ...prev, departments: true }));
    try {
      const response = await adminDepartmentService.list({ page_size: 100 });
      setDepartments(response.items.map(transformDepartment));
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  }, []);

  const addDepartment = useCallback(async (department: Omit<Department, 'id' | 'isActive'>) => {
    const createData: DepartmentCreate = {
      name: department.name,
      code: department.code,
      description: department.description,
      base_consultation_fee: department.baseConsultationFee,
    };
    const created = await adminDepartmentService.create(createData);
    setDepartments(prev => [...prev, transformDepartment(created)]);
  }, []);

  const updateDepartment = useCallback(async (id: string, department: Partial<Department>) => {
    const updateData: any = {};
    if (department.name !== undefined) updateData.name = department.name;
    if (department.code !== undefined) updateData.code = department.code;
    if (department.description !== undefined) updateData.description = department.description;
    if (department.baseConsultationFee !== undefined) updateData.base_consultation_fee = department.baseConsultationFee;
    if (department.isActive !== undefined) updateData.is_active = department.isActive;

    const updated = await adminDepartmentService.update(id, updateData);
    setDepartments(prev => prev.map(d => d.id === id ? transformDepartment(updated) : d));
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    await adminDepartmentService.delete(id);
    setDepartments(prev => prev.filter(d => d.id !== id));
  }, []);

  // ============================================================
  // Doctor Operations
  // ============================================================

  const fetchDoctors = useCallback(async () => {
    setLoading(prev => ({ ...prev, doctors: true }));
    try {
      const response = await adminDoctorService.list({ page_size: 100 });
      setDoctors(response.items.map(transformDoctor));
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(prev => ({ ...prev, doctors: false }));
    }
  }, []);

  const addDoctor = useCallback(async (doctor: Omit<Doctor, 'id' | 'departmentName'>) => {
    const createData: DoctorCreate = {
      name: doctor.name,
      speciality: doctor.speciality || undefined,
      qualification: doctor.qualification || undefined,
      registration_number: doctor.registrationNumber || undefined,
      phone: doctor.phone || undefined,
      email: doctor.email || undefined,
      room: doctor.room || undefined,
      consultation_fee: doctor.consultationFee || undefined,
      department_id: doctor.departmentId || undefined,
      user_id: doctor.userId || undefined,
    };
    const created = await adminDoctorService.create(createData);
    setDoctors(prev => [...prev, transformDoctor(created)]);
  }, []);

  const updateDoctor = useCallback(async (id: string, doctor: Partial<Doctor>) => {
    const updateData: DoctorUpdate = {};
    if (doctor.name !== undefined) updateData.name = doctor.name;
    if (doctor.speciality !== undefined) updateData.speciality = doctor.speciality;
    if (doctor.qualification !== undefined) updateData.qualification = doctor.qualification;
    if (doctor.registrationNumber !== undefined) updateData.registration_number = doctor.registrationNumber;
    if (doctor.phone !== undefined) updateData.phone = doctor.phone;
    if (doctor.email !== undefined) updateData.email = doctor.email;
    if (doctor.room !== undefined) updateData.room = doctor.room;
    // Pass null explicitly for nullable fields so backend can clear them
    if (doctor.consultationFee !== undefined) updateData.consultation_fee = doctor.consultationFee;
    if (doctor.departmentId !== undefined) updateData.department_id = doctor.departmentId;
    if (doctor.isAvailable !== undefined) updateData.is_available = doctor.isAvailable;
    if (doctor.userId !== undefined) updateData.user_id = doctor.userId;

    const updated = await adminDoctorService.update(id, updateData);
    setDoctors(prev => prev.map(d => d.id === id ? transformDoctor(updated) : d));
  }, []);

  const deleteDoctor = useCallback(async (id: string) => {
    await adminDoctorService.delete(id);
    setDoctors(prev => prev.filter(d => d.id !== id));
  }, []);

  // ============================================================
  // Staff (User) Operations
  // ============================================================

  const fetchStaff = useCallback(async () => {
    setLoading(prev => ({ ...prev, staff: true }));
    try {
      const response = await adminUserService.list({ page_size: 100 });
      setStaff(response.items.map(transformUser));
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  }, []);

  const addStaff = useCallback(async (staffMember: Omit<Staff, 'id'> & { password: string }) => {
    const createData: UserCreate = {
      username: staffMember.username,
      password: staffMember.password,
      display_name: staffMember.name,
      email: staffMember.email || undefined,
      role: staffMember.role,
    };
    const created = await adminUserService.create(createData);
    setStaff(prev => [...prev, transformUser(created)]);
  }, []);

  const updateStaff = useCallback(async (id: string, staffMember: Partial<Staff>) => {
    const updateData: any = {};
    if (staffMember.name !== undefined) updateData.display_name = staffMember.name;
    if (staffMember.email !== undefined) updateData.email = staffMember.email;
    if (staffMember.isActive !== undefined) updateData.is_active = staffMember.isActive;

    const updated = await adminUserService.update(id, updateData);
    setStaff(prev => prev.map(s => s.id === id ? transformUser(updated) : s));
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    await adminUserService.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
  }, []);

  // ============================================================
  // Medicine Operations
  // ============================================================

  const fetchMedicines = useCallback(async () => {
    setLoading(prev => ({ ...prev, medicines: true }));
    try {
      const response = await adminMedicineService.list({ page_size: 500 });
      setMedicines(response.items.map(transformMedicine));
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    } finally {
      setLoading(prev => ({ ...prev, medicines: false }));
    }
  }, []);

  const addMedicine = useCallback(async (medicine: Omit<Medicine, 'id' | 'isActive'>) => {
    const createData: MedicineCreate = {
      code: medicine.code,
      name: medicine.name,
      generic_name: medicine.genericName || undefined,
      category: medicine.category || undefined,
      specialization: medicine.specialization || undefined,
      dosage_form: medicine.dosageForm || undefined,
      strength: medicine.strength || undefined,
      manufacturer: medicine.manufacturer || undefined,
    };
    const created = await adminMedicineService.create(createData);
    setMedicines(prev => [...prev, transformMedicine(created)]);
  }, []);

  const updateMedicine = useCallback(async (id: string, medicine: Partial<Medicine>) => {
    const updateData: any = {};
    if (medicine.code !== undefined) updateData.code = medicine.code;
    if (medicine.name !== undefined) updateData.name = medicine.name;
    if (medicine.genericName !== undefined) updateData.generic_name = medicine.genericName;
    if (medicine.category !== undefined) updateData.category = medicine.category;
    if (medicine.specialization !== undefined) updateData.specialization = medicine.specialization;
    if (medicine.dosageForm !== undefined) updateData.dosage_form = medicine.dosageForm;
    if (medicine.strength !== undefined) updateData.strength = medicine.strength;
    if (medicine.manufacturer !== undefined) updateData.manufacturer = medicine.manufacturer;
    if (medicine.isActive !== undefined) updateData.is_active = medicine.isActive;

    const updated = await adminMedicineService.update(id, updateData);
    setMedicines(prev => prev.map(m => m.id === id ? transformMedicine(updated) : m));
  }, []);

  const importMedicines = useCallback(async (newMedicines: Omit<Medicine, 'id' | 'isActive'>[]) => {
    const createData: MedicineCreate[] = newMedicines.map(m => ({
      code: m.code,
      name: m.name,
      generic_name: m.genericName || undefined,
      category: m.category || undefined,
      specialization: m.specialization || undefined,
      dosage_form: m.dosageForm || undefined,
      strength: m.strength || undefined,
      manufacturer: m.manufacturer || undefined,
    }));
    await adminMedicineService.bulkCreate(createData);
    await fetchMedicines();
  }, [fetchMedicines]);

  const deleteMedicine = useCallback(async (id: string) => {
    await adminMedicineService.delete(id);
    setMedicines(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearMedicinesBySpecialization = useCallback(async (specialization: string) => {
    const result = await adminMedicineService.clearBySpecialization(specialization);
    if (result.success) {
      await fetchMedicines();
    }
    return result;
  }, [fetchMedicines]);

  // ============================================================
  // CSV Upload Operations (Preview Flow)
  // ============================================================

  const parseCSV = useCallback(async (csvContent: string, specialization: string) => {
    return await adminMedicineService.parseCSV(csvContent, specialization);
  }, []);

  const bulkSaveMedicines = useCallback(async (
    newMedicines: Omit<Medicine, 'id' | 'isActive'>[],
    specialization: string
  ) => {
    const createData: MedicineCreate[] = newMedicines.map(m => ({
      code: m.code,
      name: m.name,
      generic_name: m.genericName || undefined,
      category: m.category || undefined,
      specialization: specialization,
      dosage_form: m.dosageForm || undefined,
      strength: m.strength || undefined,
      manufacturer: m.manufacturer || undefined,
    }));

    const result = await adminMedicineService.bulkSave(createData, specialization);

    if (result.success) {
      // Refresh medicines list after successful save
      await fetchMedicines();
    }

    return result;
  }, [fetchMedicines]);

  // ============================================================
  // Settings Operations (local storage for now)
  // ============================================================

  const updateSettings = useCallback((updates: Partial<ClinicSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('clinic_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clinic_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        // Use defaults
      }
    }
  }, []);

  // ============================================================
  // Utility Functions
  // ============================================================

  const getMedicinesBySpecialization = useCallback((specialization: string) =>
    medicines.filter(m => m.specialization.toLowerCase() === specialization.toLowerCase()),
    [medicines]);

  const getSpecializations = useCallback(() =>
    [...new Set(medicines.map(m => m.specialization).filter(Boolean))],
    [medicines]);

  const getCategories = useCallback((specialization?: string) => {
    const filtered = specialization
      ? medicines.filter(m => m.specialization.toLowerCase() === specialization.toLowerCase())
      : medicines;
    return [...new Set(filtered.map(m => m.category).filter(Boolean))];
  }, [medicines]);

  return (
    <AdminContext.Provider
      value={{
        departments,
        doctors,
        staff,
        medicines,
        settings,
        loading,
        fetchDepartments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        fetchDoctors,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        fetchStaff,
        addStaff,
        updateStaff,
        deleteStaff,
        fetchMedicines,
        addMedicine,
        updateMedicine,
        importMedicines,
        deleteMedicine,
        clearMedicinesBySpecialization,
        parseCSV,
        bulkSaveMedicines,
        updateSettings,
        getMedicinesBySpecialization,
        getSpecializations,
        getCategories,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
