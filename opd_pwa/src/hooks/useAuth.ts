import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { authState, mobile, patient, token, setMobile, setAuthState, setPatientSession, logout } = useAuthStore();

  return {
    isAuthenticated: authState === 'authenticated',
    isProfileRequired: authState === 'profile_required',
    authState,
    mobile,
    patient,
    token,
    setMobile,
    setAuthState,
    setPatientSession,
    logout,
  };
};
