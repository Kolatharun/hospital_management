import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { OTPInput } from '../../components/ui/OTPInput';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Phone, ShieldCheck, ArrowRight } from 'lucide-react';

export const ChangeMobile: React.FC = () => {
  const { mobile, setMobile } = useAuth();
  const nav = useAppNavigation();

  const [step, setStep] = useState<'current_verify' | 'new_number' | 'new_verify' | 'success'>('current_verify');
  const [currentOtp, setCurrentOtp] = useState('123456');
  const [newMobileNum, setNewMobileNum] = useState('');
  const [newOtp, setNewOtp] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyCurrent = () => {
    if (currentOtp !== '123456') {
      setError('Invalid OTP code for current number');
      return;
    }
    setError(null);
    setStep('new_number');
  };

  const handleSendNewOtp = () => {
    if (!/^[6-9]\d{9}$/.test(newMobileNum)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(null);
    setStep('new_verify');
  };

  const handleVerifyNew = async () => {
    if (newOtp !== '123456') {
      setError('Invalid OTP code for new number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await profileService.changeMobileNumber(currentOtp, newMobileNum, newOtp);
      if (res.success) {
        setMobile(newMobileNum);
        setStep('success');
      } else {
        setError(res.message || 'Mobile update failed');
      }
    } catch {
      setError('Network error updating mobile number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Change Registered Mobile" />

      <ScreenContainer hasBottomNav={false}>
        <div className="space-y-4 py-2">
          {step === 'current_verify' && (
            <AppCard className="text-center space-y-4">
              <div className="w-12 h-12 bg-[#DFF3F5] rounded-full flex items-center justify-center text-[#0B6875] mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-[#16343C]">Step 1: Verify Current Number</h2>
              <p className="text-xs text-[#708188]">
                Enter 6-digit OTP sent to current registered phone +91 {mobile || '9876543210'}
              </p>

              <OTPInput value={currentOtp} onChange={(val) => { setCurrentOtp(val); setError(null); }} error={!!error} />
              {error && <p className="text-xs text-[#C94B4B] font-medium my-1">{error}</p>}

              <AppButton size="full-width" onClick={handleVerifyCurrent}>
                Verify Current Number
              </AppButton>
            </AppCard>
          )}

          {step === 'new_number' && (
            <AppCard className="space-y-4">
              <h2 className="text-sm font-bold text-[#16343C]">Step 2: Enter New Mobile Number</h2>
              <AppInput
                label="New 10-Digit Mobile Number"
                prefixText="+91"
                placeholder="98765 00000"
                value={newMobileNum}
                onChange={(e) => { setNewMobileNum(e.target.value); setError(null); }}
                error={error || undefined}
              />
              <AppButton size="full-width" onClick={handleSendNewOtp}>
                Send OTP to New Number
              </AppButton>
            </AppCard>
          )}

          {step === 'new_verify' && (
            <AppCard className="text-center space-y-4">
              <h2 className="text-sm font-bold text-[#16343C]">Step 3: Verify New Number</h2>
              <p className="text-xs text-[#708188]">Enter OTP code sent to +91 {newMobileNum}</p>
              <OTPInput value={newOtp} onChange={(val) => { setNewOtp(val); setError(null); }} error={!!error} />
              {error && <p className="text-xs text-[#C94B4B] font-medium my-1">{error}</p>}

              <AppButton size="full-width" isLoading={isSubmitting} onClick={handleVerifyNew}>
                Confirm & Update Mobile
              </AppButton>
            </AppCard>
          )}

          {step === 'success' && (
            <AppCard className="text-center space-y-4 bg-[#23866A]/10 border-[#23866A]/30">
              <h2 className="text-base font-bold text-[#23866A]">Mobile Number Updated!</h2>
              <p className="text-xs text-[#16343C]">
                Your registered phone has been successfully updated to +91 {newMobileNum}.
              </p>
              <AppButton size="full-width" onClick={nav.goToProfile}>
                Return to Profile
              </AppButton>
            </AppCard>
          )}
        </div>
      </ScreenContainer>
    </div>
  );
};
