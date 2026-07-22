import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../../services/appointmentService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { ShieldCheck, Ticket } from 'lucide-react';

export const ClinicCheckIn: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getAppointmentById(appointmentId || 'apt-501'),
  });

  const checkInMutation = useMutation({
    mutationFn: () => appointmentService.checkIn(appointmentId || 'apt-501'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      nav.goToQueueTrack(res.data?.id || appointmentId || 'apt-501');
    },
  });

  const apt = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Clinic Self Check-In" />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {apt && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-[#DFF3F5] rounded-full flex items-center justify-center text-[#0B6875] mx-auto my-2">
                <Ticket className="w-8 h-8" />
              </div>

              <h1 className="text-xl font-black text-[#16343C]">Arrived at Balaji Heart Center?</h1>
              <p className="text-xs text-[#708188] max-w-xs mx-auto">
                Confirm your arrival to enter the live OPD doctor queue and receive your queue token.
              </p>

              <AppCard className="text-left space-y-2 my-4">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Doctor:</span>
                  <span className="font-bold text-[#16343C]">{apt.doctorName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Speciality:</span>
                  <span className="font-semibold text-[#0B6875]">{apt.doctorSpeciality}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Scheduled Time:</span>
                  <span className="font-bold text-[#16343C]">{apt.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#708188]">OPD Room:</span>
                  <span className="font-semibold text-[#16343C]">{apt.doctorRoom}</span>
                </div>
              </AppCard>

              <div className="bg-[#23866A]/10 border border-[#23866A]/20 rounded-[14px] p-3 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#23866A] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#23866A] leading-relaxed">
                  Your token will be assigned by the hospital OPD queue system. You will receive live status notifications on your phone.
                </p>
              </div>

              <div className="pt-4">
                <AppButton
                  size="full-width"
                  isLoading={checkInMutation.isPending}
                  onClick={() => checkInMutation.mutate()}
                >
                  I'm Here — Issue Token & Check In
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
