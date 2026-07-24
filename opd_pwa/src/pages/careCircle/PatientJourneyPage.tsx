import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { careCircleService } from '../../services/careCircleService';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PatientJourneyTimeline } from '../../components/careCircle/PatientJourneyTimeline';
import { EmergencyHelpSheet } from '../../components/sheets/EmergencyHelpSheet';
import { ArrowLeft, Siren, Calendar, ShieldCheck, HeartPulse, Activity, User, Phone } from 'lucide-react';

export const PatientJourneyPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const nav = useAppNavigation();
  const { members, activeMemberId, setActiveMemberId } = useCareCircleStore();

  const currentMemberId = memberId || activeMemberId || 'pat-101';
  const [isEmergencySheetOpen, setIsEmergencySheetOpen] = useState(false);

  const { data: careMembers } = useQuery({
    queryKey: ['careMembers'],
    queryFn: () => careCircleService.getCareMembers(),
  });

  const memberList = careMembers || members;
  const currentMember = memberList.find((m) => m.id === currentMemberId) || memberList[0];

  const { data: journeyEvents, isLoading: isJourneyLoading } = useQuery({
    queryKey: ['patientJourney', currentMemberId],
    queryFn: () => careCircleService.getPatientJourney(currentMemberId),
  });

  const handleSwitchMember = (id: string) => {
    setActiveMemberId(id);
    nav.navigate(`/patient-journey/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#16343C] pb-24 font-sans antialiased">
      {/* Top Header */}
      <header className="w-full sticky top-0 bg-white z-40 border-b border-[#DCE6E7] shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav.navigate('/care-circle')}
              className="p-2 rounded-full hover:bg-[#F7F9F8] text-[#16343C] transition-colors cursor-pointer"
              aria-label="Back to Care Circle"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-[#16343C]">Patient Journey</h1>
              <p className="text-xs text-[#708188]">Full Medical Timeline & Health Records</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEmergencySheetOpen(true)}
            className="bg-[#BA1A1A] hover:bg-[#93000A] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Siren className="w-4 h-4 animate-pulse" />
            <span>Emergency</span>
          </button>
        </div>
      </header>

      <ScreenContainer hasBottomNav={true} className="max-w-7xl mx-auto px-5 py-5 flex flex-col gap-6">
        {/* Family Member Switcher Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {memberList.map((m) => {
            const isSelected = m.id === currentMemberId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSwitchMember(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-xs'
                    : 'bg-white text-[#708188] border-[#DCE6E7] hover:bg-[#F7F9F8]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    isSelected ? 'bg-white text-[#0B6875]' : 'bg-[#DCE6E7] text-[#16343C]'
                  }`}
                >
                  {m.avatarInitials}
                </div>
                <span>{m.relationshipLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Member Profile Header Card */}
        {currentMember && (
          <section className="bg-white rounded-[22px] p-5 border border-[#DCE6E7] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-[#DCE6E7]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0B6875] text-white font-bold text-xl flex items-center justify-center shadow-md">
                  {currentMember.avatarInitials}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#16343C]">{currentMember.fullName}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0B6875]/10 text-[#0B6875] text-xs font-bold">
                      {currentMember.relationshipLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#708188] mt-1">
                    <span>MRN: <strong className="text-[#16343C]">{currentMember.mrn}</strong></span>
                    <span>•</span>
                    <span>Blood Group: <strong className="text-[#16343C]">{currentMember.bloodGroup}</strong></span>
                    <span>•</span>
                    <span>{currentMember.gender}, {currentMember.age} years</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => nav.goToDoctorDetails('doc-1')}
                  className="flex-1 sm:flex-initial bg-[#0B6875] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#084F59] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
                <a
                  href={`tel:${currentMember.emergencyContact}`}
                  className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#DCE6E7] text-[#0B6875] hover:bg-[#EAEFEF] transition-colors"
                  title="Call Emergency Contact"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Health Snapshot Vitals Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7] flex flex-col">
                <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-[#C94B4B]" />
                  Blood Pressure
                </span>
                <span className="text-sm font-bold text-[#16343C] mt-1">{currentMember.lastVitals.bloodPressure}</span>
                <span className="text-[10px] text-[#708188] mt-0.5">{currentMember.lastVitals.lastUpdated}</span>
              </div>

              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7] flex flex-col">
                <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#0B6875]" />
                  Heart Rate
                </span>
                <span className="text-sm font-bold text-[#16343C] mt-1">{currentMember.lastVitals.heartRate} bpm</span>
                <span className="text-[10px] text-[#708188] mt-0.5">Sinus Rhythm</span>
              </div>

              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7] flex flex-col">
                <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#23866A]" />
                  Oxygen (SpO2)
                </span>
                <span className="text-sm font-bold text-[#16343C] mt-1">{currentMember.lastVitals.spo2}%</span>
                <span className="text-[10px] text-[#708188] mt-0.5">Optimal</span>
              </div>

              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7] flex flex-col">
                <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#7B1FA2]" />
                  Access Level
                </span>
                <span className="text-sm font-bold text-[#16343C] mt-1">Full Authorized</span>
                <span className="text-[10px] text-[#2E7D32] font-semibold mt-0.5">Verified Link</span>
              </div>
            </div>
          </section>
        )}

        {/* Patient Journey Timeline Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#708188]">
              Health Timeline & Records
            </h3>
          </div>

          {isJourneyLoading ? (
            <div className="bg-white p-8 rounded-2xl text-center text-[#708188] border border-[#DCE6E7]">
              Loading Patient Journey history...
            </div>
          ) : (
            <PatientJourneyTimeline
              events={journeyEvents || []}
              patientName={currentMember?.fullName || 'Patient'}
            />
          )}
        </section>
      </ScreenContainer>

      {/* Emergency Sheet */}
      <EmergencyHelpSheet
        isOpen={isEmergencySheetOpen}
        onClose={() => setIsEmergencySheetOpen(false)}
        careMembers={memberList}
        activePatientId={currentMemberId}
        onSelectPatient={(id) => handleSwitchMember(id)}
      />
    </div>
  );
};
