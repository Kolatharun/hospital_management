import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../../services/appointmentService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PageState } from '../../components/ui/PageState';
import { getAppointmentStatusStyle } from '../../utils/status';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight } from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const nav = useAppNavigation();
  const [tab, setTab] = useState<'upcoming' | 'previous' | 'cancelled'>('upcoming');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
  });

  const allAppointments = data?.data || [];

  const filteredAppointments = allAppointments.filter((a) => {
    if (tab === 'upcoming') {
      return a.status === 'confirmed' || a.status === 'check_in_available' || a.status === 'checked_in' || a.status === 'waiting' || a.status === 'rescheduled';
    }
    if (tab === 'previous') {
      return a.status === 'completed';
    }
    return a.status === 'cancelled' || a.status === 'doctor_cancelled';
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="My Appointments" showBack={false} />

      <ScreenContainer hasBottomNav={true}>
        {/* Tab Control */}
        <div className="mb-4">
          <SegmentedControl
            options={[
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Completed', value: 'previous' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {/* List of Appointments */}
        <PageState
          isLoading={isLoading}
          isError={isError}
          isEmpty={filteredAppointments.length === 0}
          errorProps={{ onRetry: refetch }}
          emptyProps={{
            title: `No ${tab} appointments`,
            description: tab === 'upcoming' ? 'You have no scheduled doctor consultations.' : 'No record found in this section.',
            actionLabel: tab === 'upcoming' ? 'Book Appointment' : undefined,
            onAction: tab === 'upcoming' ? () => nav.goToDoctorDetails('doc-1') : undefined,
          }}
        >
          <div className="space-y-3.5">
            {filteredAppointments.map((apt) => (
              <AppCard
                key={apt.id}
                variant="interactive"
                onClick={() => nav.goToAppointmentDetails(apt.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-[14px] bg-[#DFF3F5] text-[#0B6875] flex items-center justify-center shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#16343C]">{apt.doctorName}</h2>
                      <p className="text-xs text-[#708188]">{apt.doctorSpeciality}</p>
                    </div>
                  </div>
                  <StatusBadge {...getAppointmentStatusStyle(apt.status)} />
                </div>

                <div className="bg-[#F7F9F8] rounded-[12px] p-2.5 my-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#16343C]">
                    <Calendar className="w-4 h-4 text-[#0B6875]" />
                    <span className="font-semibold">{formatDate(apt.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#16343C]">
                    <Clock className="w-4 h-4 text-[#0B6875]" />
                    <span className="font-semibold">{apt.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#708188] col-span-2">
                    <MapPin className="w-4 h-4 text-[#0B6875]" />
                    <span>{apt.doctorRoom} • Main OPD Wing</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#708188]">OP No: <strong className="text-[#16343C]">{apt.opNumber}</strong></span>

                  {apt.status === 'check_in_available' ? (
                    <AppButton size="small" onClick={(e) => { e.stopPropagation(); nav.goToCheckIn(apt.id); }}>
                      Check-In Now
                    </AppButton>
                  ) : apt.status === 'checked_in' || apt.status === 'waiting' ? (
                    <AppButton size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); nav.goToQueueTrack(apt.id); }}>
                      Live Queue
                    </AppButton>
                  ) : (
                    <span className="text-[#0B6875] font-bold flex items-center">
                      View Details <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </AppCard>
            ))}
          </div>
        </PageState>
      </ScreenContainer>
    </div>
  );
};
