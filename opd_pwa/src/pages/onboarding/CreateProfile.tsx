import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProfileSchema, CreateProfileFormData } from '../../schemas/profileSchemas';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { UserCheck } from 'lucide-react';

export const CreateProfile: React.FC = () => {
  const { mobile, setPatientSession } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateProfileFormData>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      city: 'Mumbai',
      preferredLanguage: 'en',
      ownershipConsent: true,
    },
  });

  const onSubmit = async (data: CreateProfileFormData) => {
    try {
      const res = await authService.createProfile({
        ...data,
        mobile: mobile || '9876543210',
      });
      if (res.success) {
        setPatientSession(res.data.patient, res.data.session.token);
        navigate('/profile-created');
      } else {
        setError('fullName', { message: res.message || 'Profile creation failed' });
      }
    } catch {
      setError('fullName', { message: 'Network error creating patient profile' });
    }
  };

  return (
    <div className="py-4">
      <div className="bg-white rounded-[22px] border border-[#DCE6E7] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#DFF3F5] rounded-full flex items-center justify-center text-[#0B6875]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#16343C]">Create Patient Account</h2>
            <p className="text-xs text-[#708188]">Mobile +91 {mobile || '9876543210'} Verified</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AppInput
            label="Full Patient Name"
            placeholder="e.g. Rajesh Kumar Sharma"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <div className="grid grid-cols-2 gap-3">
            <AppInput
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />

            <AppSelect
              label="Gender"
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ]}
              error={errors.gender?.message}
              {...register('gender')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AppInput
              label="City / Locality"
              placeholder="Mumbai"
              error={errors.city?.message}
              {...register('city')}
            />

            <AppSelect
              label="App Language"
              options={[
                { label: 'English', value: 'en' },
                { label: 'हिंदी (Hindi)', value: 'hi' },
                { label: 'मराठी (Marathi)', value: 'mr' },
              ]}
              error={errors.preferredLanguage?.message}
              {...register('preferredLanguage')}
            />
          </div>

          <AppInput
            label="Residential Address (Optional)"
            placeholder="House no, street name"
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-left">
              <input
                type="checkbox"
                className="mt-1 rounded text-[#0B6875] focus:ring-[#0B6875]"
                {...register('ownershipConsent')}
              />
              <span className="text-xs text-[#708188]">
                I confirm this account belongs to me as the patient, and I consent to receiving digital clinic notifications.
              </span>
            </label>
            {errors.ownershipConsent && (
              <p className="text-xs text-[#C94B4B] mt-1">{errors.ownershipConsent.message}</p>
            )}
          </div>

          <AppButton type="submit" variant="primary" size="full-width" isLoading={isSubmitting} className="mt-4">
            Register & Continue
          </AppButton>
        </form>
      </div>
    </div>
  );
};
