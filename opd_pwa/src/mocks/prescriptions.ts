import { Prescription } from '../types';

export const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-701',
    visitId: 'vis-301',
    patientId: 'pat-101',
    mrNumber: 'MR-2026-8842',
    doctorName: 'Dr. Ananya Rao',
    doctorSpeciality: 'Senior Interventional Cardiologist',
    consultationDate: '2026-06-15',
    status: 'active',
    specialAdvice: 'Rest after meals. Avoid heavy salt intake. Continue walking 30 mins daily.',
    followUpDate: '2026-07-24',
    documentId: 'doc-rx-701',
    medicines: [
      {
        id: 'med-1',
        medicineName: 'Telmisartan',
        strength: '40 mg',
        form: 'tablet',
        dosageSchedule: { morning: true, afternoon: false, night: false },
        foodRelation: 'before_food',
        durationDays: 30,
        specialInstructions: 'Take with half glass of warm water at 08:00 AM',
      },
      {
        id: 'med-2',
        medicineName: 'Atorvastatin',
        strength: '10 mg',
        form: 'tablet',
        dosageSchedule: { morning: false, afternoon: false, night: true },
        foodRelation: 'after_food',
        durationDays: 30,
        specialInstructions: 'Take before sleep at 09:30 PM',
      },
      {
        id: 'med-3',
        medicineName: 'Ecosprin',
        strength: '75 mg',
        form: 'tablet',
        dosageSchedule: { morning: false, afternoon: true, night: false },
        foodRelation: 'after_food',
        durationDays: 30,
        specialInstructions: 'Post lunch',
      },
    ],
  },
];
