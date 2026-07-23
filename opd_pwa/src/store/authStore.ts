import { create } from 'zustand';
import { AuthState, PatientProfile } from '../types';
import { safeStorage } from '../utils/storage';

interface AuthStoreState {
  authState: AuthState;
  mobile: string;
  patient: PatientProfile | null;
  token: string | null;
  setMobile: (mobile: string) => void;
  setAuthState: (state: AuthState) => void;
  setPatientSession: (patient: PatientProfile, token: string) => void;
  logout: () => void;
}

const INITIAL_TOKEN = safeStorage.getItem('bhc_auth_token');

export const useAuthStore = create<AuthStoreState>((set) => ({
  authState: INITIAL_TOKEN ? 'authenticated' : 'anonymous',
  mobile: safeStorage.getItem('bhc_user_mobile') || '',
  patient: INITIAL_TOKEN
    ? {
        id: 'pat-101',
        mrNumber: 'MR-2026-8842',
        fullName: 'Rajesh K. Sharma',
        mobile: safeStorage.getItem('bhc_user_mobile') || '9876543210',
        dateOfBirth: '1984-05-14',
        gender: 'male',
        bloodGroup: 'B+',
        city: 'Mumbai',
        address: '402, Sunshine Heights, M.G. Road, Dadar West',
        pincode: '400028',
        preferredLanguage: 'en',
        createdAt: '2026-01-10T10:00:00Z',
      }
    : null,
  token: INITIAL_TOKEN,

  setMobile: (mobile: string) => {
    safeStorage.setItem('bhc_user_mobile', mobile);
    set({ mobile });
  },

  setAuthState: (authState: AuthState) => set({ authState }),

  setPatientSession: (patient: PatientProfile, token: string) => {
    safeStorage.setItem('bhc_auth_token', token);
    safeStorage.setItem('bhc_user_mobile', patient.mobile);
    set({
      patient,
      token,
      mobile: patient.mobile,
      authState: 'authenticated',
    });
  },

  logout: () => {
    safeStorage.removeItem('bhc_auth_token');
    safeStorage.removeItem('bhc_user_mobile');
    set({
      patient: null,
      token: null,
      mobile: '',
      authState: 'anonymous',
    });
  },
}));
