import { simulateLatency } from './apiClient';
import { AuthSession, PatientProfile } from '../types';
import { mockPatients } from '../mocks/patients';

export const authService = {
  requestOtp: async (mobile: string) => {
    return simulateLatency({ mobile, otpSent: true, message: 'OTP sent successfully to +91 ' + mobile }, 500);
  },

  verifyOtp: async (mobile: string, otp: string) => {
    if (otp !== '123456') {
      await new Promise((res) => setTimeout(res, 400));
      return {
        success: false,
        data: null as any,
        message: 'Invalid OTP. Please enter 123456 for testing.',
      };
    }

    const existingPatient = mockPatients.find((p) => p.mobile === mobile);

    if (existingPatient) {
      const session: AuthSession = {
        token: `mock_jwt_token_${Date.now()}`,
        mobile,
        patientId: existingPatient.id,
        mrNumber: existingPatient.mrNumber,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      return simulateLatency({ isNewPatient: false, session, patient: existingPatient }, 600);
    } else {
      return simulateLatency({ isNewPatient: true, mobile }, 500);
    }
  },

  createProfile: async (profileData: Partial<PatientProfile>) => {
    const newPatient: PatientProfile = {
      id: `pat-${Date.now()}`,
      mrNumber: `MR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: profileData.fullName || 'Patient Name',
      mobile: profileData.mobile || '9876543210',
      dateOfBirth: profileData.dateOfBirth || '1990-01-01',
      gender: profileData.gender || 'male',
      city: profileData.city || 'Mumbai',
      address: profileData.address,
      pincode: profileData.pincode,
      emergencyContactName: profileData.emergencyContactName,
      emergencyContactPhone: profileData.emergencyContactPhone,
      preferredLanguage: profileData.preferredLanguage || 'en',
      createdAt: new Date().toISOString(),
    };

    const session: AuthSession = {
      token: `mock_jwt_token_${Date.now()}`,
      mobile: newPatient.mobile,
      patientId: newPatient.id,
      mrNumber: newPatient.mrNumber,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    return simulateLatency({ patient: newPatient, session }, 700);
  },
};
