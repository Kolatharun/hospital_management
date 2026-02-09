/**
 * Services Index - Export all API services
 */

export { api } from './api';
export { authService } from './authService';
export { patientService } from './patientService';
export { appointmentService } from './appointmentService';
export { vitalsService } from './vitalsService';
export { billingService } from './billingService';
export { prescriptionService } from './prescriptionService';
export { queueService } from './queueService';
export { doctorService } from './doctorService';
export { departmentService } from './departmentService';
export { documentService } from './documentService';

// Re-export types
export type { LoginRequest, LoginResponse, User } from './authService';
export type { Patient, PatientCreate, PatientSearchResponse } from './patientService';
export type { Appointment, AppointmentCreate, QueueStats, QueueDisplayData } from './appointmentService';
export type { Vitals, VitalsCreate } from './vitalsService';
export type { Bill, BillCreate, BillLineItem, PaymentRequest, DayPaymentSummary } from './billingService';
export type { Prescription, PrescriptionCreate, PrescriptionUpdate, Medicine } from './prescriptionService';
export type { LabQueueItem, LabQueueCreate, PharmacyQueueItem, PharmacyQueueCreate } from './queueService';
export type { PatientHistory, TodaySummary } from './doctorService';
export type { Department, Doctor, DoctorsByDepartment } from './departmentService';
export type { Document, DocumentCreate, DocumentListResponse, TodayDocumentsResponse } from './documentService';
