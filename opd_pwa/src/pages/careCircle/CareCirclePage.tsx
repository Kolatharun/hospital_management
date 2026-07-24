import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { careCircleService } from '../../services/careCircleService';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AddCareMemberModal } from '../../components/careCircle/AddCareMemberModal';
import { EmergencyHelpSheet } from '../../components/sheets/EmergencyHelpSheet';
import { CareMember } from '../../types';
import { ArrowLeft, Users, UserPlus, HeartPulse, ChevronRight, Siren, ShieldCheck, Activity } from 'lucide-react';

export const CareCirclePage: React.FC = () => {
  const nav = useAppNavigation();
  const { activeMemberId, setActiveMemberId, members, addMember, setMembers } = useCareCircleStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmergencySheetOpen, setIsEmergencySheetOpen] = useState(false);

  const { data: fetchedMembers, isLoading } = useQuery({
    queryKey: ['careMembers'],
    queryFn: async () => {
      const data = await careCircleService.getCareMembers();
      setMembers(data);
      return data;
    },
  });

  const displayMembers = fetchedMembers || members;

  const handleSelectMember = (id: string) => {
    setActiveMemberId(id);
    nav.navigate(`/patient-journey/${id}`);
  };

  const handleMemberAdded = (newMember: CareMember) => {
    addMember(newMember);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#16343C] pb-24 font-sans antialiased">
      {/* Top Header */}
      <header className="w-full sticky top-0 bg-white z-40 border-b border-[#DCE6E7] shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={nav.goHome}
              className="p-2 rounded-full hover:bg-[#F7F9F8] text-[#16343C] transition-colors cursor-pointer"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-[#16343C]">Care Circle</h1>
              <p className="text-xs text-[#708188]">Authorized Family Health Accounts</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0B6875] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#084F59] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </header>

      <ScreenContainer hasBottomNav={true} className="max-w-7xl mx-auto px-5 py-6 flex flex-col gap-6">
        {/* Banner Section */}
        <section className="bg-[#0B6875] text-white rounded-[22px] p-5 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#9AE4F3]" />
                <h2 className="text-lg font-bold text-white">Family Health Overview</h2>
              </div>
              <p className="text-xs text-white/80 mt-1 max-w-md">
                Monitor health journeys, track lab reports, view prescriptions, and launch priority emergency alerts for your family.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEmergencySheetOpen(true)}
              className="bg-[#BA1A1A] hover:bg-[#93000A] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span>Emergency Help</span>
            </button>
          </div>
        </section>

        {/* Care Members List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#708188]">
              Authorized Members ({displayMembers.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl text-center text-[#708188] border border-[#DCE6E7]">
              Loading Care Circle members...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-[20px] p-5 border border-[#DCE6E7] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] flex flex-col gap-4 hover:border-[#0B6875]/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#0B6875] text-white font-bold text-base flex items-center justify-center shadow-sm">
                        {member.avatarInitials}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#16343C]">{member.fullName}</h4>
                          {member.isPrimaryAccountHolder && (
                            <span className="px-2 py-0.5 rounded-full bg-[#0B6875]/10 text-[#0B6875] text-[10px] font-bold">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#708188]">
                          {member.relationshipLabel} • MRN: {member.mrn}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                      {member.activeStatusText.split('•')[0] || 'Active'}
                    </span>
                  </div>

                  {/* Vitals Summary */}
                  <div className="grid grid-cols-3 gap-2 bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-[#C94B4B]" />
                        BP
                      </span>
                      <span className="text-xs font-bold text-[#16343C]">{member.lastVitals.bloodPressure}</span>
                    </div>

                    <div className="flex flex-col border-l border-[#DCE6E7] pl-3">
                      <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#0B6875]" />
                        HR
                      </span>
                      <span className="text-xs font-bold text-[#16343C]">{member.lastVitals.heartRate} bpm</span>
                    </div>

                    <div className="flex flex-col border-l border-[#DCE6E7] pl-3">
                      <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#23866A]" />
                        SpO2
                      </span>
                      <span className="text-xs font-bold text-[#16343C]">{member.lastVitals.spo2}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-[#DCE6E7]">
                    <button
                      type="button"
                      onClick={() => handleSelectMember(member.id)}
                      className="flex-1 bg-[#0B6875] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#084F59] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>View Health Journey</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMemberId(member.id);
                        setIsEmergencySheetOpen(true);
                      }}
                      className="px-3 bg-[#FFEBEE] text-[#BA1A1A] hover:bg-[#FFCDD2] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Siren className="w-4 h-4" />
                      <span>Alert</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScreenContainer>

      {/* Add Member Modal */}
      <AddCareMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleMemberAdded}
      />

      {/* Emergency Sheet */}
      <EmergencyHelpSheet
        isOpen={isEmergencySheetOpen}
        onClose={() => setIsEmergencySheetOpen(false)}
        careMembers={displayMembers}
        activePatientId={activeMemberId}
        onSelectPatient={(id) => setActiveMemberId(id)}
      />
    </div>
  );
};
