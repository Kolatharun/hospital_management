import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../../services/doctorService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { FilterChip } from '../../components/ui/FilterChip';
import { Avatar } from '../../components/ui/Avatar';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Search, MapPin, Calendar, Star } from 'lucide-react';

export const FindDoctor: React.FC = () => {
  const nav = useAppNavigation();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctors', search, selectedDept],
    queryFn: () => doctorService.getDoctors(search, selectedDept),
  });

  const doctors = data?.data || [];

  const departments = ['All', 'Cardiology', 'Preventive Cardiology'];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Find OPD Doctor" subtitle="Balaji Heart Center Specialists" />

      <ScreenContainer hasBottomNav={true}>
        {/* Search Bar */}
        <div className="mb-3">
          <AppInput
            placeholder="Search doctor, speciality or qualification..."
            leftIcon={<Search className="w-4 h-4 text-[#708188]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-2">
          {departments.map((dept) => (
            <FilterChip
              key={dept}
              label={dept}
              isSelected={selectedDept === dept}
              onClick={() => setSelectedDept(dept)}
            />
          ))}
        </div>

        {/* Doctor Cards */}
        <PageState
          isLoading={isLoading}
          isError={isError}
          isEmpty={doctors.length === 0}
          errorProps={{ onRetry: refetch }}
          emptyProps={{
            title: 'No Doctors Found',
            description: 'Try adjusting your search query or department filter.',
          }}
        >
          <div className="space-y-3.5">
            {doctors.map((doc) => (
              <AppCard
                key={doc.id}
                variant="interactive"
                onClick={() => nav.goToDoctorDetails(doc.id)}
                className="flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar src={doc.avatarUrl} name={doc.name} size="large" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#16343C]">{doc.name}</h2>
                      <span className="text-[10px] font-bold text-[#0B6875] bg-[#DFF3F5] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#0B6875]" /> {doc.experienceYears} yrs exp
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#0B6875] mt-0.5">{doc.speciality}</p>
                    <p className="text-[11px] text-[#708188]">{doc.qualification}</p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#708188]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0B6875]" /> {doc.roomNumber}
                      </span>
                      <span>Languages: {doc.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#F7F9F8] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#23866A] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Next Slot: {doc.nextAvailableSlot}</span>
                  </div>

                  <AppButton size="small" onClick={(e) => { e.stopPropagation(); nav.goToBookDoctor(doc.id); }}>
                    Book Slots
                  </AppButton>
                </div>
              </AppCard>
            ))}
          </div>
        </PageState>
      </ScreenContainer>
    </div>
  );
};
