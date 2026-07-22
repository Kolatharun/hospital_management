export interface MedicalVisit {
  id: string;
  opNumber: string;
  mrNumber: string;
  doctorName: string;
  doctorSpeciality: string;
  date: string;
  chiefComplaint: string;
  patientVisibleDiagnosis: string;
  vitals: {
    bloodPressure: string;
    pulseRate: string;
    weightKg: string;
    spO2?: string;
    temperatureF?: string;
  };
  prescriptionId?: string;
  advisedTestIds?: string[];
  followUpDate?: string;
  documentIds?: string[];
}

export interface LabReport {
  id: string;
  testName: string;
  category: string;
  advisedByDoctor: string;
  advisedDate: string;
  status: 'advised' | 'processing' | 'ready' | 'reviewed';
  reportDate?: string;
  documentId?: string;
  testPreparationNotes?: string;
  reviewedByDoctorNotes?: string;
}
