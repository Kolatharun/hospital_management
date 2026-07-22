export interface PatientProfile {
  id: string;
  mrNumber: string;
  fullName: string;
  mobile: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  city: string;
  address?: string;
  pincode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  createdAt: string;
}
