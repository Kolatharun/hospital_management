import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../schemas/authSchemas';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { HeartPulse, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const { setMobile } = useAuth();
  const { goToVerifyOtp } = useAppNavigation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: '9876543210',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authService.requestOtp(data.mobile);
      if (res.success) {
        setMobile(data.mobile);
        goToVerifyOtp();
      } else {
        setError('mobile', { message: res.message || 'Failed to send OTP' });
      }
    } catch {
      setError('mobile', { message: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="flex flex-col min-h-full justify-between py-6">
      <div>
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center my-6">
          <div className="w-16 h-16 bg-[#0B6875] rounded-[20px] flex items-center justify-center text-white mb-4 shadow-md">
            <HeartPulse className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-[#16343C] tracking-tight">Balaji Heart Center</h1>
          <p className="text-xs text-[#708188] font-medium mt-1">Patient OPD Services & Queue Portal</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-[22px] border border-[#DCE6E7] p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#16343C]">Patient Login</h2>
            <p className="text-xs text-[#708188] mt-0.5">
              Enter your mobile number to log in or register your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AppInput
              label="Mobile Number"
              prefixText="+91"
              type="tel"
              placeholder="98765 43210"
              error={errors.mobile?.message}
              {...register('mobile')}
            />

            <AppButton type="submit" variant="primary" size="full-width" isLoading={isSubmitting}>
              Continue with OTP
            </AppButton>
          </form>

          {/* Privacy Note */}
          <div className="mt-4 pt-4 border-t border-[#DCE6E7] flex items-start gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-[#23866A] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#708188] leading-tight">
              By continuing, you agree to Balaji Heart Center's OPD Service terms. Verification OTP will be sent via SMS.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Support Link */}
      <div className="mt-8 text-center">
        <Link to="/support" className="inline-flex items-center gap-1.5 text-xs text-[#0B6875] font-semibold hover:underline">
          <HelpCircle className="w-4 h-4" />
          <span>Need help with clinic registration?</span>
        </Link>
      </div>
    </div>
  );
};
