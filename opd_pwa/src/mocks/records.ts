import { MedicalVisit, LabReport } from '../types';

export const mockVisits: MedicalVisit[] = [
  {
    id: 'vis-301',
    opNumber: 'OP-2026-09120',
    mrNumber: 'MR-2026-8842',
    doctorName: 'Dr. Ananya Rao',
    doctorSpeciality: 'Senior Interventional Cardiologist',
    date: '2026-06-15',
    chiefComplaint: 'Routine 3-month post-angioplasty follow-up, mild fatigue.',
    patientVisibleDiagnosis: 'Essential Hypertension, Post PCI Follow-up',
    vitals: {
      bloodPressure: '128/82 mmHg',
      pulseRate: '72 bpm',
      weightKg: '68 kg',
      spO2: '99%',
      temperatureF: '98.4 °F',
    },
    prescriptionId: 'rx-701',
    advisedTestIds: ['lab-101', 'lab-102'],
    followUpDate: '2026-07-24',
    documentIds: ['doc-vis-301'],
  },
];

export const mockLabReports: LabReport[] = [
  {
    id: 'lab-101',
    testName: 'Lipid Profile Panel',
    category: 'Biochemistry',
    advisedByDoctor: 'Dr. Ananya Rao',
    advisedDate: '2026-06-15',
    status: 'reviewed',
    reportDate: '2026-06-16',
    documentId: 'doc-lab-101',
    testPreparationNotes: '10 to 12 hours fasting required before blood draw.',
    reviewedByDoctorNotes: 'Cholesterol & LDL levels within target range. Continue Atorvastatin 10mg.',
  },
  {
    id: 'lab-102',
    testName: 'HbA1c & Fasting Blood Sugar',
    category: 'Diabetology',
    advisedByDoctor: 'Dr. Ananya Rao',
    advisedDate: '2026-06-15',
    status: 'reviewed',
    reportDate: '2026-06-16',
    documentId: 'doc-lab-102',
    testPreparationNotes: 'Overnight fasting required.',
    reviewedByDoctorNotes: 'HbA1c is 5.8% (Normal). Maintain current dietary routine.',
  },
  {
    id: 'lab-103',
    testName: '2D Echocardiogram & Doppler',
    category: 'Cardiography',
    advisedByDoctor: 'Dr. Ananya Rao',
    advisedDate: '2026-07-24',
    status: 'advised',
    testPreparationNotes: 'No special fasting required. Bring previous ECG report.',
  },
];
