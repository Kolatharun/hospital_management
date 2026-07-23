import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { AppButton } from '../../components/ui/AppButton';
import { ShieldAlert, LogIn } from 'lucide-react';

export const SessionExpired: React.FC = () => {
  const { logout } = useAuth();
  const nav = useAppNavigation();

  const handleReLogin = () => {
    logout();
    nav.goToLogin();
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 bg-[#C94B4B]/10 text-[#C94B4B] rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-[#16343C]">Patient Session Expired</h1>
      <p className="text-xs text-[#708188] max-w-xs mt-1 mb-6">
        For your security, your session has timed out. Please verify with mobile OTP to sign in again.
      </p>

      <AppButton size="medium" leftIcon={<LogIn className="w-4 h-4" />} onClick={handleReLogin}>
        Log In Again
      </AppButton>
    </div>
  );
};
