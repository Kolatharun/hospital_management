import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { DateCard } from '../../components/ui/DateCard';
import { TimeSlot } from '../../components/ui/TimeSlot';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

export const BookDoctor: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const nav = useAppNavigation();

  const [selectedDate, setSelectedDate] = useState('2026-07-24');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>('slot-3');
  const [consultationType, setConsultationType] = useState<'new' | 'review'>('review');
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const { data: docRes } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId || 'doc-1'),
  });

  const { data: slotsRes } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: () => doctorService.getTimeSlots(doctorId || 'doc-1', selectedDate),
  });

  const doctor = docRes?.data;
  const slots = slotsRes?.data || [];

  const dates = [
    { dayLabel: 'Fri', dateNumber: '24', monthLabel: 'Jul', fullDate: '2026-07-24' },
    { dayLabel: 'Sat', dateNumber: '25', monthLabel: 'Jul', fullDate: '2026-07-25' },
    { dayLabel: 'Mon', dateNumber: '27', monthLabel: 'Jul', fullDate: '2026-07-27' },
    { dayLabel: 'Tue', dateNumber: '28', monthLabel: 'Jul', fullDate: '2026-07-28' },
  ];

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleConfirmBooking = async () => {
    if (!doctor || !selectedSlot) return;
    setIsBooking(true);
    try {
      const res = await appointmentService.createAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpeciality: doctor.speciality,
        doctorRoom: doctor.roomNumber,
        date: selectedDate,
        timeSlot: selectedSlot.startTime,
        type: consultationType,
      });

      if (res.success) {
        setShowConfirmSheet(false);
        nav.goToAppointmentDetails(res.data.id);
      }
    } catch {
      // Handle booking error
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Book Appointment" subtitle={doctor?.name} />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={!doctor}>
          {doctor && (
            <div className="space-y-4 pb-20">
              {/* Consultation Type Selector */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2 block">Consultation Category</label>
                <SegmentedControl
                  options={[
                    { label: 'Review / Follow-up', value: 'review' },
                    { label: 'New Patient Consultation', value: 'new' },
                  ]}
                  value={consultationType}
                  onChange={setConsultationType}
                />
              </AppCard>

              {/* Select Date */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#0B6875]" /> Select Appointment Date
                </label>

                <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
                  {dates.map((d) => (
                    <DateCard
                      key={d.fullDate}
                      dayLabel={d.dayLabel}
                      dateNumber={d.dateNumber}
                      monthLabel={d.monthLabel}
                      isSelected={selectedDate === d.fullDate}
                      onClick={() => {
                        setSelectedDate(d.fullDate);
                        setSelectedSlotId(null);
                      }}
                    />
                  ))}
                </div>
              </AppCard>

              {/* Select Time Slot */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0B6875]" /> Select Time Slot (Morning & Evening)
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {slots.map((slot) => (
                    <TimeSlot
                      key={slot.id}
                      time={slot.startTime}
                      isAvailable={slot.isAvailable}
                      isSelected={selectedSlotId === slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                    />
                  ))}
                </div>
              </AppCard>

              {/* Sticky Confirm Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
                <div className="w-full max-w-[480px]">
                  <AppButton
                    size="full-width"
                    disabled={!selectedSlotId}
                    onClick={() => setShowConfirmSheet(true)}
                  >
                    Continue to Confirmation
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>

      {/* Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        title="Confirm Appointment"
      >
        <div className="space-y-4">
          <div className="bg-[#F7F9F8] rounded-[16px] border border-[#DCE6E7] p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#708188]">Doctor:</span>
              <span className="font-bold text-[#16343C]">{doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#708188]">Speciality:</span>
              <span className="font-semibold text-[#0B6875]">{doctor?.speciality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#708188]">Date & Time:</span>
              <span className="font-bold text-[#16343C]">24 July 2026 at {selectedSlot?.startTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#708188]">OPD Room:</span>
              <span className="font-semibold text-[#16343C]">{doctor?.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#708188]">Type:</span>
              <span className="font-semibold text-[#16343C] uppercase">{consultationType}</span>
            </div>
          </div>

          <div className="bg-[#DFF3F5]/40 border border-[#0B6875]/20 rounded-[12px] p-3 text-[11px] text-[#0B6875] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Please arrive 15 minutes prior to your time slot for OPD check-in.</span>
          </div>

          <AppButton size="full-width" isLoading={isBooking} onClick={handleConfirmBooking}>
            Confirm & Book Appointment
          </AppButton>
        </div>
      </BottomSheet>
    </div>
  );
};
