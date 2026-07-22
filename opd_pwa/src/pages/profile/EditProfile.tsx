import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editProfileSchema, EditProfileFormData } from '../../schemas/profileSchemas';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../hooks/useAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppButton } from '../../components/ui/AppButton';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Lock } from 'lucide-react';

export const EditProfile: React.FC = () => {
  const { patient, setPatientSession } = useAuth();
  const nav = useAppNavigation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: patient?.fullName || 'Rajesh K. Sharma',
      dateOfBirth: patient?.dateOfBirth || '1984-05-14',
      gender: patient?.gender || 'male',
      city: patient?.city || 'Mumbai',
      address: patient?.address || '402, Sunshine Heights, Dadar West',
      pincode: patient?.pincode || '400028',
      emergencyContactName: patient?.emergencyContactName || 'Sunita Sharma',
      emergencyContactPhone: patient?.emergencyContactPhone || '9820012345',
      preferredLanguage: patient?.preferredLanguage || 'en',
    },
  });

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      const res = await profileService.updateProfile(data);
      if (res.success && patient) {
        setPatientSession({ ...patient, ...data }, 'mock_jwt_token');
        nav.goToProfile();
      }
    } catch {
      // Handle error
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Edit Personal Details" />

      <ScreenContainer hasBottomNav={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-20">
          {/* Locked Identity Banner */}
          <AppCard className="bg-[#F7F9F8] border-[#DCE6E7] flex items-center justify-between text-xs">
            <div>
              <p className="text-[#708188]">Medical Record Identifier</p>
              <p className="font-extrabold text-[#0B6875] text-sm">{patient?.mrNumber || 'MR-2026-8842'}</p>
            </div>
            <div className="flex items-center gap-1 text-[#708188] bg-white border border-[#DCE6E7] px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5" /> Locked Field
            </div>
          </AppCard>

          <AppInput label="Full Name" error={errors.fullName?.message} {...register('fullName')} />

          <div className="grid grid-cols-2 gap-3">
            <AppInput label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
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
            <AppInput label="City" error={errors.city?.message} {...register('city')} />
            <AppInput label="PIN Code" error={errors.pincode?.message} {...register('pincode')} />
          </div>

          <AppInput label="Residential Address" error={errors.address?.message} {...register('address')} />

          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2">Emergency Contact Information</h3>
            <div className="space-y-3">
              <AppInput label="Emergency Contact Name" error={errors.emergencyContactName?.message} {...register('emergencyContactName')} />
              <AppInput label="Emergency Contact Phone" prefixText="+91" error={errors.emergencyContactPhone?.message} {...register('emergencyContactPhone')} />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
            <div className="w-full max-w-[480px]">
              <AppButton type="submit" size="full-width" isLoading={isSubmitting}>
                Save Updated Details
              </AppButton>
            </div>
          </div>
        </form>
      </ScreenContainer>
    </div>
  );
};
