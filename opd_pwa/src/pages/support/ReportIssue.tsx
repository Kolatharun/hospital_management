import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supportIssueSchema, SupportIssueFormData } from '../../schemas/supportSchemas';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../hooks/useAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppTextarea } from '../../components/ui/AppTextarea';
import { AppButton } from '../../components/ui/AppButton';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { CheckCircle2 } from 'lucide-react';

export const ReportIssue: React.FC = () => {
  const { patient } = useAuth();
  const nav = useAppNavigation();
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupportIssueFormData>({
    resolver: zodResolver(supportIssueSchema),
    defaultValues: {
      category: 'appointment_issue',
      description: '',
      contactNumber: patient?.mobile || '9876543210',
      preferredCallbackTime: 'morning',
    },
  });

  const onSubmit = async (data: SupportIssueFormData) => {
    try {
      const res = await supportService.submitIssue(data);
      if (res.success) {
        setSubmittedTicketId(res.data.id);
      }
    } catch {
      // Handle error
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Report an Issue" />

      <ScreenContainer hasBottomNav={false}>
        {!submittedTicketId ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-20">
            <AppSelect
              label="Issue Category"
              options={[
                { label: 'Appointment Booking Issue', value: 'appointment_issue' },
                { label: 'Live OPD Queue Delay', value: 'queue_delay' },
                { label: 'Prescription Download Problem', value: 'prescription_download' },
                { label: 'Pharmacy Order Status', value: 'pharmacy_request' },
                { label: 'App Technical Bug', value: 'app_technical' },
                { label: 'Other Clinic Enquiry', value: 'other' },
              ]}
              error={errors.category?.message}
              {...register('category')}
            />

            <AppTextarea
              label="Describe Your Issue"
              placeholder="Provide details about what went wrong (do not enter sensitive medical history)..."
              error={errors.description?.message}
              {...register('description')}
            />

            <AppInput
              label="Callback Mobile Number"
              prefixText="+91"
              error={errors.contactNumber?.message}
              {...register('contactNumber')}
            />

            <AppSelect
              label="Preferred Callback Time"
              options={[
                { label: 'Morning (09:00 AM - 12:00 PM)', value: 'morning' },
                { label: 'Afternoon (12:00 PM - 04:00 PM)', value: 'afternoon' },
                { label: 'Evening (04:00 PM - 07:00 PM)', value: 'evening' },
              ]}
              error={errors.preferredCallbackTime?.message}
              {...register('preferredCallbackTime')}
            />

            <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
              <div className="w-full max-w-[480px]">
                <AppButton type="submit" size="full-width" isLoading={isSubmitting}>
                  Submit Support Ticket
                </AppButton>
              </div>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#23866A]/10 text-[#23866A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-[#16343C]">Support Request Submitted</h1>
            <p className="text-xs text-[#708188]">
              Ticket Number: <strong className="text-[#0B6875] text-sm">{submittedTicketId}</strong>
            </p>

            <AppCard className="text-left text-xs bg-[#F7F9F8]">
              Our OPD front desk support staff will contact you during your preferred callback window.
            </AppCard>

            <AppButton size="full-width" onClick={nav.goToSupport}>
              Return to Help Center
            </AppButton>
          </div>
        )}
      </ScreenContainer>
    </div>
  );
};
