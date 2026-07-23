import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { DateCard } from '../../components/ui/DateCard';
import { TimeSlot } from '../../components/ui/TimeSlot';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Calendar, Clock, RefreshCw } from 'lucide-react';

export const RescheduleAppointment: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();
  const queryClient = useQueryClient();

  const [newDate, setNewDate] = useState('2026-07-27');
  const [newSlotId, setNewSlotId] = useState<string | null>('slot-4');
  const [reason, setReason] = useState('');

  const { data: aptRes, isLoading: isAptLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getAppointmentById(appointmentId || 'apt-501'),
  });

  const apt = aptRes?.data;

  const { data: slotsRes } = useQuery({
    queryKey: ['slots', apt?.doctorId, newDate],
    queryFn: () => doctorService.getTimeSlots(apt?.doctorId || 'doc-1', newDate),
    enabled: !!apt,
  });

  const slots = slotsRes?.data || [];
  const selectedSlot = slots.find((s) => s.id === newSlotId);

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      appointmentService.rescheduleAppointment(
        appointmentId || 'apt-501',
        newDate,
        selectedSlot?.startTime || '11:00 AM',
        reason
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      nav.goToAppointmentDetails(appointmentId || 'apt-501');
    },
  });

  const dates = [
    { dayLabel: 'Mon', dateNumber: '27', monthLabel: 'Jul', fullDate: '2026-07-27' },
    { dayLabel: 'Tue', dateNumber: '28', monthLabel: 'Jul', fullDate: '2026-07-28' },
    { dayLabel: 'Wed', dateNumber: '29', monthLabel: 'Jul', fullDate: '2026-07-29' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Reschedule Appointment" subtitle={apt?.doctorName} />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isAptLoading}>
          {apt && (
            <div className="space-y-4 pb-20">
              {/* Existing vs New Summary */}
              <AppCard className="bg-[#DFF3F5]/30 border-[#0B6875]/30">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B6875] mb-2">
                  <RefreshCw className="w-4 h-4" /> Current Booking
                </div>
                <p className="text-xs text-[#16343C]">
                  <strong>{apt.doctorName}</strong> on <strong>{apt.date}</strong> at <strong>{apt.timeSlot}</strong>
                </p>
              </AppCard>

              {/* Select New Date */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0B6875]" /> Select New Date
                </label>
                <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
                  {dates.map((d) => (
                    <DateCard
                      key={d.fullDate}
                      dayLabel={d.dayLabel}
                      dateNumber={d.dateNumber}
                      monthLabel={d.monthLabel}
                      isSelected={newDate === d.fullDate}
                      onClick={() => {
                        setNewDate(d.fullDate);
                        setNewSlotId(null);
                      }}
                    />
                  ))}
                </div>
              </AppCard>

              {/* Select New Time Slot */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0B6875]" /> Select New Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {slots.map((slot) => (
                    <TimeSlot
                      key={slot.id}
                      time={slot.startTime}
                      isAvailable={slot.isAvailable}
                      isSelected={newSlotId === slot.id}
                      onClick={() => setNewSlotId(slot.id)}
                    />
                  ))}
                </div>
              </AppCard>

              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-1.5 block">Reason for Rescheduling (Optional)</label>
                <textarea
                  className="w-full text-xs p-3 border border-[#DCE6E7] rounded-[12px] focus:outline-none focus:border-[#0B6875]"
                  rows={2}
                  placeholder="e.g. Schedule adjustment..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </AppCard>

              <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
                <div className="w-full max-w-[480px]">
                  <AppButton
                    size="full-width"
                    disabled={!newSlotId}
                    isLoading={rescheduleMutation.isPending}
                    onClick={() => rescheduleMutation.mutate()}
                  >
                    Confirm Reschedule Slot
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
