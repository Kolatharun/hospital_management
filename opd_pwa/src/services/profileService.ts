import { simulateLatency } from './apiClient';
import { PatientProfile } from '../types';

export const profileService = {
  updateProfile: async (updatedData: Partial<PatientProfile>) => {
    return simulateLatency({ success: true, updatedData }, 500);
  },

  changeMobileNumber: async (oldOtp: string, newMobile: string, newOtp: string) => {
    if (oldOtp !== '123456' || newOtp !== '123456') {
      return { success: false, data: null, message: 'Invalid OTP verification code. Use 123456 for testing.' };
    }
    return simulateLatency({ success: true, newMobile }, 600);
  },
};
