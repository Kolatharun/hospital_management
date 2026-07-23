import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../../services/appointmentService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { PageState } from '../../components/ui/PageState';
import { getAppointmentStatusStyle } from '../../utils/status';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Calendar, Clock, MapPin, Stethoscope, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();
  const queryClient = useQueryClient();

  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getAppointmentById(appointmentId || 'apt-501'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => appointmentService.cancelAppointment(appointmentId || 'apt-501', reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      setShowCancelSheet(false);
    },
  });

  const apt = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Appointment Details" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {apt && (
            <div className="space-y-4">
              {/* Status Header Card */}
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#708188] uppercase tracking-wider">OP Number</span>
                    <p className="text-base font-black text-[#0B6875]">{apt.opNumber}</p>
                  </div>
                  <StatusBadge {...getAppointmentStatusStyle(apt.status)} />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#DCE6E7]">
                  <div className="w-12 h-12 rounded-[16px] bg-[#DFF3F5] text-[#0B6875] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#16343C]">{apt.doctorName}</h2>
                    <p className="text-xs text-[#708188]">{apt.doctorSpeciality}</p>
                  </div>
                </div>
              </AppCard>

              {/* Date & Location Summary */}
              <AppCard className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0B6875]" /> Date:
                  </span>
                  <span className="font-bold text-[#16343C]">{formatDate(apt.date)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0B6875]" /> Time Slot:
                  </span>
                  <span className="font-bold text-[#16343C]">{apt.timeSlot}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0B6875]" /> Room / Wing:
                  </span>
                  <span className="font-semibold text-[#16343C]">{apt.doctorRoom}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#708188]">Consultation Type:</span>
                  <span className="font-semibold text-[#16343C] uppercase">{apt.type} Patient</span>
                </div>
              </AppCard>

              {/* Contextual Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {apt.status === 'check_in_available' && (
                  <AppButton size="full-width" variant="primary" onClick={() => nav.goToCheckIn(apt.id)}>
                    Proceed to Clinic Check-In
                  </AppButton>
                )}

                {(apt.status === 'checked_in' || apt.status === 'waiting') && (
                  <AppButton size="full-width" variant="primary" onClick={() => nav.goToQueueTrack(apt.id)}>
                    Track Live Queue Status
                  </AppButton>
                )}

                {apt.status === 'completed' && (
                  <AppButton size="full-width" variant="secondary" onClick={() => nav.goToPrescription('rx-701')}>
                    View Consultation Prescription
                  </AppButton>
                )}

                {(apt.status === 'confirmed' || apt.status === 'check_in_available') && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <AppButton
                      variant="outline"
                      size="medium"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => nav.navigate(`/appointments/${apt.id}/reschedule`)}
                    >
                      Reschedule
                    </AppButton>

                    <AppButton
                      variant="destructive"
                      size="medium"
                      onClick={() => setShowCancelSheet(true)}
                    >
                      Cancel Slot
                    </AppButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>

      {/* Cancel Appointment Bottom Sheet */}
      <BottomSheet
        isOpen={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4 text-left">
          <div className="p-3 bg-[#C94B4B]/10 rounded-[12px] text-xs text-[#C94B4B] flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Are you sure you want to cancel your appointment with {apt?.doctorName}?</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#16343C] mb-1.5 block">Reason for cancellation (Optional)</label>
            <textarea
              className="w-full text-xs p-3 border border-[#DCE6E7] rounded-[12px] focus:outline-none focus:border-[#0B6875]"
              rows={3}
              placeholder="e.g. Health improved, schedule conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5">
            <AppButton variant="outline" size="full-width" onClick={() => setShowCancelSheet(false)}>
              Keep Appointment
            </AppButton>
            <AppButton
              variant="destructive"
              size="full-width"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason)}
            >
              Confirm Cancel
            </AppButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
