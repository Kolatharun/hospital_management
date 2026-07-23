export interface PrescribedMedicine {
  id: string;
  medicineName: string;
  strength: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops';
  dosageSchedule: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  foodRelation: 'before_food' | 'after_food' | 'with_food' | 'empty_stomach';
  durationDays: number;
  specialInstructions?: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  mrNumber: string;
  doctorName: string;
  doctorSpeciality: string;
  consultationDate: string;
  medicines: PrescribedMedicine[];
  specialAdvice?: string;
  followUpDate?: string;
  documentId?: string;
  status: 'active' | 'completed' | 'expired';
}
