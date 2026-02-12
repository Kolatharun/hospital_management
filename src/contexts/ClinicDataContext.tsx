import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import patientService, { Patient as ApiPatient, PatientCreate } from '@/services/patientService';
import appointmentService, { Appointment as ApiAppointment, AppointmentCreate } from '@/services/appointmentService';
import prescriptionService, { Prescription as ApiPrescription, PrescriptionCreate, PrescriptionUpdate } from '@/services/prescriptionService';
import vitalsService, { Vitals as ApiVitals, VitalsCreate } from '@/services/vitalsService';
import queueService, { LabQueueItem as ApiLabQueueItem, PharmacyQueueItem as ApiPharmacyQueueItem, LabQueueCreate, PharmacyQueueCreate } from '@/services/queueService';
import departmentService, { Department, Doctor } from '@/services/departmentService';

// Re-export interfaces for backward compatibility with components
export interface Patient {
  id: string;
  mrNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  patientType?: 'New' | 'Review' | 'Emergency';
  emergencyContact?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  createdAt: string;
}

export interface PatientVitals {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  spo2: number;
  pulse: number;
  bloodPressure: string;
  cvs: string;
  rs: string;
  jvp: string;
  weight: number;
  hlp: string;
  htn: string;
  dm: string;
  smoking: string;
  familyHOCAD: string;
  heartDisease: string;
  ptcaCabg: string;
  currentDrugs: string;
  recordedAt: string;
  recordedBy: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  waitingTime?: number;
  room?: string;
  notes?: string;
  queueType?: 'main' | 'lab' | 'pharmacy';
  opNumber?: string;
  tokenNumber?: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId: string;
  diagnosis: string;
  complaint?: string;
  history?: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  labTests?: string;
  advice?: string;
  vitals?: PatientVitals;
  notes?: string;
  createdAt: string;
  doctorName: string;
  sentToPatient?: boolean;
  sentVia?: 'whatsapp' | 'email';
}

export interface LabQueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  opNumber: string;
  tokenNumber: number;
  labTests: string[];
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface PharmacyQueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  opNumber: string;
  tokenNumber: number;
  medicines: string[];
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface PendingBillingItem {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  labTests: string[];
  addedAt: string;
}

interface ClinicDataContextType {
  // Data
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  vitalsRecords: PatientVitals[];
  labQueue: LabQueueItem[];
  pharmacyQueue: PharmacyQueueItem[];
  pendingBillingItems: PendingBillingItem[];
  departments: Department[];
  doctors: Doctor[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Patient operations
  addPatient: (patient: Omit<Patient, 'id' | 'mrNumber' | 'createdAt'>) => Promise<Patient>;
  searchPatients: (query: string) => Patient[];
  getPatientById: (id: string) => Patient | undefined;
  refreshPatients: () => Promise<void>;

  // Appointment operations
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  getPatientAppointments: (patientId: string) => Appointment[];
  getTodayAppointments: () => Appointment[];
  refreshAppointments: () => Promise<void>;

  // Prescription operations
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => Promise<Prescription>;
  updatePrescription: (id: string, updates: Partial<Prescription>) => Promise<void>;
  getPatientPrescriptions: (patientId: string) => Prescription[];
  getPrescriptionByAppointment: (appointmentId: string) => Prescription | undefined;

  // Vitals operations
  addVitals: (vitals: PatientVitals) => Promise<void>;
  getPatientVitals: (patientId: string) => PatientVitals | undefined;
  getAppointmentVitals: (appointmentId: string) => PatientVitals | undefined;

  // Queue operations
  addToLabQueue: (item: Omit<LabQueueItem, 'id' | 'tokenNumber' | 'createdAt'>) => Promise<void>;
  updateLabQueueStatus: (id: string, status: LabQueueItem['status']) => Promise<void>;
  addToPharmacyQueue: (item: Omit<PharmacyQueueItem, 'id' | 'tokenNumber' | 'createdAt'>) => Promise<void>;
  updatePharmacyQueueStatus: (id: string, status: PharmacyQueueItem['status']) => Promise<void>;
  refreshLabQueue: () => Promise<void>;
  refreshPharmacyQueue: () => Promise<void>;

  // Buffer time
  addBufferTime: (appointmentId: string, minutes: number) => Promise<void>;

  // Billing operations (kept local for now)
  addPendingBillingItem: (item: Omit<PendingBillingItem, 'id' | 'addedAt'>) => void;
  removePendingBillingItem: (id: string) => void;
}

const ClinicDataContext = createContext<ClinicDataContextType | undefined>(undefined);

// Helper functions to map API responses to frontend interfaces
function mapApiPatientToPatient(apiPatient: ApiPatient): Patient {
  return {
    id: apiPatient.id,
    mrNumber: apiPatient.mr_number,
    firstName: apiPatient.first_name,
    lastName: apiPatient.last_name,
    phone: apiPatient.phone,
    email: apiPatient.email || undefined,
    dateOfBirth: apiPatient.date_of_birth || undefined,
    gender: apiPatient.gender as 'Male' | 'Female' | 'Other',
    maritalStatus: apiPatient.marital_status as Patient['maritalStatus'] || undefined,
    patientType: apiPatient.patient_type as Patient['patientType'] || undefined,
    emergencyContact: apiPatient.emergency_contact || undefined,
    address: apiPatient.address || undefined,
    city: apiPatient.city || undefined,
    state: apiPatient.state || undefined,
    pinCode: apiPatient.pin_code || undefined,
    createdAt: apiPatient.created_at,
  };
}

function mapApiAppointmentToAppointment(apiApt: ApiAppointment, patients: Patient[]): Appointment {
  const patient = patients.find(p => p.id === apiApt.patient_id);
  return {
    id: apiApt.id,
    patientId: apiApt.patient_id,
    patient: patient || {
      id: apiApt.patient_id,
      mrNumber: apiApt.patient_mr_number || '',
      firstName: apiApt.patient_name?.split(' ')[0] || '',
      lastName: apiApt.patient_name?.split(' ').slice(1).join(' ') || '',
      phone: apiApt.patient_phone || '',
      email: apiApt.patient_email || undefined,
      gender: 'Male',
      createdAt: '',
    },
    doctorId: apiApt.doctor_id || '',
    doctorName: apiApt.doctor_name || '',
    date: apiApt.appointment_date,
    time: apiApt.appointment_time || '',
    status: apiApt.status as Appointment['status'],
    waitingTime: apiApt.waiting_time_minutes || 0,
    room: apiApt.room || '1',
    notes: apiApt.notes || undefined,
    opNumber: apiApt.op_number,
    tokenNumber: apiApt.token_number,
  };
}

function mapApiPrescriptionToPrescription(apiRx: ApiPrescription): Prescription {
  return {
    id: apiRx.id,
    patientId: apiRx.patient_id,
    appointmentId: apiRx.appointment_id,
    diagnosis: apiRx.diagnosis,
    complaint: apiRx.complaint || undefined,
    history: apiRx.history || undefined,
    medicines: apiRx.medicines.map(m => ({
      name: m.medicine_name,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
    })),
    labTests: apiRx.lab_tests || undefined,
    advice: apiRx.advice || undefined,
    notes: apiRx.notes || undefined,
    createdAt: apiRx.created_at,
    doctorName: apiRx.doctor_name || '',
    sentToPatient: apiRx.sent_to_patient,
    sentVia: apiRx.sent_via as 'whatsapp' | 'email' | undefined,
  };
}

function mapApiVitalsToPatientVitals(apiVitals: ApiVitals): PatientVitals {
  return {
    id: apiVitals.id,
    appointmentId: apiVitals.appointment_id,
    patientId: apiVitals.patient_id,
    patientName: apiVitals.patient_name || '',
    mrNumber: apiVitals.patient_mr_number || '',
    spo2: apiVitals.spo2 || 0,
    pulse: apiVitals.pulse || 0,
    bloodPressure: apiVitals.blood_pressure || '',
    cvs: apiVitals.cvs || '',
    rs: apiVitals.rs || '',
    jvp: apiVitals.jvp || '',
    weight: apiVitals.weight || 0,
    hlp: apiVitals.hlp || '',
    htn: apiVitals.htn || '',
    dm: apiVitals.dm || '',
    smoking: apiVitals.smoking || '',
    familyHOCAD: apiVitals.family_ho_cad || '',
    heartDisease: apiVitals.heart_disease || '',
    ptcaCabg: apiVitals.ptca_cabg || '',
    currentDrugs: apiVitals.current_drugs || '',
    recordedAt: apiVitals.created_at,
    recordedBy: apiVitals.recorded_by || '',
  };
}

function mapApiLabQueueToLabQueueItem(apiItem: ApiLabQueueItem): LabQueueItem {
  return {
    id: apiItem.id,
    appointmentId: apiItem.appointment_id,
    patientId: apiItem.patient_id,
    patientName: apiItem.patient_name,
    mrNumber: apiItem.mr_number,
    opNumber: apiItem.op_number,
    tokenNumber: apiItem.token_number,
    labTests: apiItem.lab_tests,
    status: (apiItem.status === 'pending' ? 'waiting' : apiItem.status) as LabQueueItem['status'],
    createdAt: apiItem.created_at,
  };
}

function mapApiPharmacyQueueToPharmacyQueueItem(apiItem: ApiPharmacyQueueItem): PharmacyQueueItem {
  return {
    id: apiItem.id,
    appointmentId: apiItem.appointment_id,
    patientId: apiItem.patient_id,
    patientName: apiItem.patient_name,
    mrNumber: apiItem.mr_number,
    opNumber: apiItem.op_number,
    tokenNumber: apiItem.token_number,
    medicines: apiItem.medicines,
    status: (apiItem.status === 'pending' ? 'waiting' : apiItem.status) as PharmacyQueueItem['status'],
    createdAt: apiItem.created_at,
  };
}

export function ClinicDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitalsRecords, setVitalsRecords] = useState<PatientVitals[]>([]);
  const [labQueue, setLabQueue] = useState<LabQueueItem[]>([]);
  const [pharmacyQueue, setPharmacyQueue] = useState<PharmacyQueueItem[]>([]);
  const [pendingBillingItems, setPendingBillingItems] = useState<PendingBillingItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data only when authenticated
  useEffect(() => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      // Clear data when not authenticated
      setPatients([]);
      setAppointments([]);
      setPrescriptions([]);
      setVitalsRecords([]);
      setLabQueue([]);
      setPharmacyQueue([]);
      setDepartments([]);
      setDoctors([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          patientsData,
          appointmentsData,
          prescriptionsData,
          labQueueData,
          pharmacyQueueData,
          departmentsData,
          doctorsData,
        ] = await Promise.all([
          patientService.getTodayRegistrations().catch(() => []),
          appointmentService.getTodayAppointments().catch(() => []),
          prescriptionService.getTodayPrescriptions().catch(() => []),
          queueService.getLabQueue().catch(() => []),
          queueService.getPharmacyQueue().catch(() => []),
          departmentService.getDepartments().catch(() => []),
          departmentService.getDoctors().catch(() => []),
        ]);

        const mappedPatients = patientsData.map(mapApiPatientToPatient);
        setPatients(mappedPatients);
        setAppointments(appointmentsData.map(apt => mapApiAppointmentToAppointment(apt, mappedPatients)));
        setPrescriptions(prescriptionsData.map(mapApiPrescriptionToPrescription));
        setLabQueue(labQueueData.map(mapApiLabQueueToLabQueueItem));
        setPharmacyQueue(pharmacyQueueData.map(mapApiPharmacyQueueToPharmacyQueueItem));
        setDepartments(departmentsData);
        setDoctors(doctorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, authLoading]);

  // Refresh functions
  const refreshPatients = useCallback(async () => {
    try {
      const data = await patientService.getTodayRegistrations();
      setPatients(data.map(mapApiPatientToPatient));
    } catch (err) {
      console.error('Failed to refresh patients:', err);
    }
  }, []);

  const refreshAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getTodayAppointments();
      setAppointments(data.map(apt => mapApiAppointmentToAppointment(apt, patients)));
    } catch (err) {
      console.error('Failed to refresh appointments:', err);
    }
  }, [patients]);

  const refreshLabQueue = useCallback(async () => {
    try {
      const data = await queueService.getLabQueue();
      setLabQueue(data.map(mapApiLabQueueToLabQueueItem));
    } catch (err) {
      console.error('Failed to refresh lab queue:', err);
    }
  }, []);

  const refreshPharmacyQueue = useCallback(async () => {
    try {
      const data = await queueService.getPharmacyQueue();
      setPharmacyQueue(data.map(mapApiPharmacyQueueToPharmacyQueueItem));
    } catch (err) {
      console.error('Failed to refresh pharmacy queue:', err);
    }
  }, []);

  // Auto-refresh polling: keep appointments, lab queue, pharmacy queue in sync every 15 seconds
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const intervalId = setInterval(() => {
      refreshAppointments();
      refreshLabQueue();
      refreshPharmacyQueue();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, authLoading, refreshAppointments, refreshLabQueue, refreshPharmacyQueue]);

  // Patient operations
  const addPatient = async (patientData: Omit<Patient, 'id' | 'mrNumber' | 'createdAt'>): Promise<Patient> => {
    const createData: PatientCreate = {
      first_name: patientData.firstName,
      last_name: patientData.lastName,
      phone: patientData.phone,
      email: patientData.email || undefined,
      date_of_birth: patientData.dateOfBirth || undefined,
      gender: patientData.gender,
      marital_status: patientData.maritalStatus || undefined,
      patient_type: patientData.patientType || undefined,
      emergency_contact: patientData.emergencyContact || undefined,
      address: patientData.address || undefined,
      city: patientData.city || undefined,
      state: patientData.state || undefined,
      pin_code: patientData.pinCode || undefined,
    };

    const response = await patientService.register(createData);
    const newPatient = mapApiPatientToPatient(response);
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const searchPatients = (query: string): Patient[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return patients;

    return patients.filter(
      p =>
        p.firstName.toLowerCase().includes(lowerQuery) ||
        p.lastName.toLowerCase().includes(lowerQuery) ||
        p.phone.includes(lowerQuery) ||
        p.mrNumber.toLowerCase().includes(lowerQuery)
    );
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  // Appointment operations
  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
    const createData: AppointmentCreate = {
      patient_id: appointmentData.patientId,
      doctor_id: appointmentData.doctorId,
      appointment_date: appointmentData.date,
      appointment_time: appointmentData.time,
      notes: appointmentData.notes,
    };

    const response = await appointmentService.create(createData);
    const newAppointment = mapApiAppointmentToAppointment(response, patients);
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    if (status === 'in-progress') {
      await appointmentService.callPatient(id);
    } else if (status === 'completed') {
      await appointmentService.completeAppointment(id);
    } else if (status === 'cancelled') {
      await appointmentService.cancelAppointment(id);
    }
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status } : apt))
    );
  };

  const getPatientAppointments = (patientId: string) =>
    appointments.filter(a => a.patientId === patientId);

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date === today);
  };

  // Prescription operations
  const addPrescription = async (prescriptionData: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> => {
    const createData: PrescriptionCreate = {
      appointment_id: prescriptionData.appointmentId,
      diagnosis: prescriptionData.diagnosis,
      complaint: prescriptionData.complaint,
      history: prescriptionData.history,
      lab_tests: prescriptionData.labTests,
      advice: prescriptionData.advice,
      notes: prescriptionData.notes,
      medicines: prescriptionData.medicines.map(m => ({
        medicine_name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
      })),
    };

    const response = await prescriptionService.create(createData);
    const newPrescription = mapApiPrescriptionToPrescription(response);
    setPrescriptions(prev => [...prev, newPrescription]);
    return newPrescription;
  };

  const updatePrescription = async (id: string, updates: Partial<Prescription>) => {
    const updateData: PrescriptionUpdate = {};
    if (updates.diagnosis) updateData.diagnosis = updates.diagnosis;
    if (updates.complaint) updateData.complaint = updates.complaint;
    if (updates.history) updateData.history = updates.history;
    if (updates.labTests) updateData.lab_tests = updates.labTests;
    if (updates.advice) updateData.advice = updates.advice;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.medicines) {
      updateData.medicines = updates.medicines.map(m => ({
        medicine_name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
      }));
    }

    await prescriptionService.update(id, updateData);
    setPrescriptions(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const getPatientPrescriptions = (patientId: string) =>
    prescriptions.filter(p => p.patientId === patientId);

  const getPrescriptionByAppointment = (appointmentId: string) =>
    prescriptions.find(p => p.appointmentId === appointmentId);

  // Vitals operations
  const addVitals = async (vitals: PatientVitals) => {
    const createData: VitalsCreate = {
      appointment_id: vitals.appointmentId,
      spo2: vitals.spo2,
      pulse: vitals.pulse,
      blood_pressure: vitals.bloodPressure,
      cvs: vitals.cvs,
      rs: vitals.rs,
      jvp: vitals.jvp,
      weight: vitals.weight,
      hlp: vitals.hlp,
      htn: vitals.htn,
      dm: vitals.dm,
      smoking: vitals.smoking,
      family_ho_cad: vitals.familyHOCAD,
      heart_disease: vitals.heartDisease,
      ptca_cabg: vitals.ptcaCabg,
      current_drugs: vitals.currentDrugs,
    };

    const response = await vitalsService.record(createData);
    const newVitals = mapApiVitalsToPatientVitals(response);
    setVitalsRecords(prev => [...prev, newVitals]);
  };

  const getPatientVitals = (patientId: string) =>
    vitalsRecords.find(v => v.patientId === patientId);

  const getAppointmentVitals = (appointmentId: string) =>
    vitalsRecords.find(v => v.appointmentId === appointmentId);

  // Queue operations
  const addToLabQueue = async (item: Omit<LabQueueItem, 'id' | 'tokenNumber' | 'createdAt'>) => {
    const createData: LabQueueCreate = {
      appointment_id: item.appointmentId,
      lab_tests: item.labTests,
    };

    const response = await queueService.addToLabQueue(createData);
    const newItem = mapApiLabQueueToLabQueueItem(response);
    setLabQueue(prev => [...prev, newItem]);
  };

  const updateLabQueueStatus = async (id: string, status: LabQueueItem['status']) => {
    if (status === 'in-progress') {
      await queueService.startLabProcessing(id);
    } else if (status === 'completed') {
      await queueService.completeLabItem(id);
    }
    setLabQueue(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const addToPharmacyQueue = async (item: Omit<PharmacyQueueItem, 'id' | 'tokenNumber' | 'createdAt'>) => {
    const createData: PharmacyQueueCreate = {
      appointment_id: item.appointmentId,
      medicines: item.medicines,
    };

    const response = await queueService.addToPharmacyQueue(createData);
    const newItem = mapApiPharmacyQueueToPharmacyQueueItem(response);
    setPharmacyQueue(prev => [...prev, newItem]);
  };

  const updatePharmacyQueueStatus = async (id: string, status: PharmacyQueueItem['status']) => {
    if (status === 'in-progress') {
      await queueService.startPharmacyProcessing(id);
    } else if (status === 'completed') {
      await queueService.completePharmacyItem(id);
    }
    setPharmacyQueue(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  // Buffer time operation
  const addBufferTime = async (appointmentId: string, minutes: number) => {
    await appointmentService.addBufferTime(appointmentId, minutes);
    // Refresh from DB to get recalculated waiting times for all patients
    await refreshAppointments();
  };

  // Billing operations (kept local for now - can be connected to billing API later)
  const addPendingBillingItem = (item: Omit<PendingBillingItem, 'id' | 'addedAt'>) => {
    const newItem: PendingBillingItem = {
      ...item,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setPendingBillingItems(prev => [...prev, newItem]);
  };

  const removePendingBillingItem = (id: string) => {
    setPendingBillingItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <ClinicDataContext.Provider
      value={{
        patients,
        appointments,
        prescriptions,
        vitalsRecords,
        labQueue,
        pharmacyQueue,
        pendingBillingItems,
        departments,
        doctors,
        isLoading,
        error,
        addPatient,
        searchPatients,
        getPatientById,
        refreshPatients,
        addAppointment,
        updateAppointmentStatus,
        getPatientAppointments,
        getTodayAppointments,
        refreshAppointments,
        addPrescription,
        updatePrescription,
        getPatientPrescriptions,
        getPrescriptionByAppointment,
        addVitals,
        getPatientVitals,
        getAppointmentVitals,
        addToLabQueue,
        updateLabQueueStatus,
        addToPharmacyQueue,
        updatePharmacyQueueStatus,
        refreshLabQueue,
        refreshPharmacyQueue,
        addBufferTime,
        addPendingBillingItem,
        removePendingBillingItem,
      }}
    >
      {children}
    </ClinicDataContext.Provider>
  );
}

export function useClinicData() {
  const context = useContext(ClinicDataContext);
  if (context === undefined) {
    throw new Error('useClinicData must be used within a ClinicDataProvider');
  }
  return context;
}
