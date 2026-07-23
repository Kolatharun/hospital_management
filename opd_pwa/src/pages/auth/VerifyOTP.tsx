import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { authService } from '../../services/authService';
import { OTPInput } from '../../components/ui/OTPInput';
import { AppButton } from '../../components/ui/AppButton';
import { maskPhoneNumber } from '../../utils/phone';
import { Shield, ArrowLeft } from 'lucide-react';

export const VerifyOTP: React.FC = () => {
  const { mobile, setPatientSession, setAuthState } = useAuth();
  const { goToLogin, goToCreateProfile, goHome } = useAppNavigation();

  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter complete 6-digit OTP code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await authService.verifyOtp(mobile || '9876543210', otp);
      if (res.success) {
        if (res.data.isNewPatient) {
          setAuthState('profile_required');
          goToCreateProfile();
        } else {
          setPatientSession(res.data.patient, res.data.session.token);
          goHome();
        }
      } else {
        setError(res.message || 'Invalid OTP code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setError(null);
    await authService.requestOtp(mobile || '9876543210');
  };

  return (
    <div className="flex flex-col min-h-full justify-between py-6">
      <div>
        <button
          type="button"
          onClick={goToLogin}
          className="flex items-center gap-1 text-xs font-semibold text-[#0B6875] mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Phone Number</span>
        </button>

        <div className="bg-white rounded-[22px] border border-[#DCE6E7] p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#DFF3F5] rounded-full flex items-center justify-center text-[#0B6875] mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#16343C]">Verify Phone Number</h2>
            <p className="text-xs text-[#708188] mt-1">
              Enter the 6-digit code sent to <span className="font-bold text-[#16343C]">{maskPhoneNumber(mobile || '9876543210')}</span>
            </p>
            <div className="mt-2 inline-block bg-[#DFF3F5]/60 text-[#0B6875] text-[11px] px-2.5 py-1 rounded-full font-bold">
              Test OTP: 123456
            </div>
          </div>

          <OTPInput value={otp} onChange={(val) => { setOtp(val); setError(null); }} error={!!error} />

          {error && <p className="text-xs text-[#C94B4B] font-medium text-center my-2">{error}</p>}

          <div className="mt-6 space-y-3">
            <AppButton variant="primary" size="full-width" isLoading={isVerifying} onClick={handleVerify}>
              Verify & Proceed
            </AppButton>

            <div className="text-center pt-2">
              {countdown > 0 ? (
                <p className="text-xs text-[#708188]">Resend OTP code in <span className="font-semibold text-[#16343C]">{countdown}s</span></p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-xs text-[#0B6875] font-bold hover:underline"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
