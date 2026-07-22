export interface Doctor {
  id: string;
  name: string;
  speciality: string;
  qualification: string;
  experienceYears: number;
  languages: string[];
  department: string;
  roomNumber: string;
  avatarUrl: string;
  consultationTypes: ('new' | 'review')[];
  availableDays: string[];
  nextAvailableSlot?: string;
  bio: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  type: 'morning' | 'afternoon' | 'evening';
}
