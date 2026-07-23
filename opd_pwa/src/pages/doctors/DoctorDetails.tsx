import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../../services/doctorService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { Avatar } from '../../components/ui/Avatar';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { MapPin, Clock, Languages } from 'lucide-react';

export const DoctorDetails: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const nav = useAppNavigation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getDoctorById(doctorId || 'doc-1'),
  });

  const doctor = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Doctor Profile" />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {doctor && (
            <div className="space-y-4 pb-20">
              {/* Doctor Hero Card */}
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white text-center p-6">
                <Avatar src={doctor.avatarUrl} name={doctor.name} size="large" className="mx-auto mb-3 w-20 h-20" />
                <h1 className="text-lg font-extrabold text-[#16343C]">{doctor.name}</h1>
                <p className="text-xs font-bold text-[#0B6875] mt-0.5">{doctor.speciality}</p>
                <p className="text-xs text-[#708188] mt-0.5">{doctor.qualification}</p>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#DCE6E7] text-xs">
                  <div>
                    <p className="font-extrabold text-[#16343C]">{doctor.experienceYears}+ Years</p>
                    <p className="text-[11px] text-[#708188]">Experience</p>
                  </div>
                  <div className="h-6 border-r border-[#DCE6E7]" />
                  <div>
                    <p className="font-extrabold text-[#16343C]">{doctor.roomNumber}</p>
                    <p className="text-[11px] text-[#708188]">OPD Chamber</p>
                  </div>
                </div>
              </AppCard>

              {/* Bio & Details */}
              <AppCard>
                <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2">About Doctor</h2>
                <p className="text-xs text-[#708188] leading-relaxed">{doctor.bio}</p>
              </AppCard>

              <AppCard className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-[#16343C]">
                  <Languages className="w-4 h-4 text-[#0B6875]" />
                  <span>Languages Spoken: <strong className="font-semibold">{doctor.languages.join(', ')}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#16343C]">
                  <MapPin className="w-4 h-4 text-[#0B6875]" />
                  <span>Location: <strong className="font-semibold">Main OPD Wing, Balaji Heart Center</strong></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#16343C]">
                  <Clock className="w-4 h-4 text-[#0B6875]" />
                  <span>Available Days: <strong className="font-semibold">{doctor.availableDays.join(', ')}</strong></span>
                </div>
              </AppCard>

              {/* Sticky Action */}
              <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
                <div className="w-full max-w-[480px]">
                  <AppButton size="full-width" onClick={() => nav.goToBookDoctor(doctor.id)}>
                    View Available Slots & Book
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
