import React from 'react';
import { CareMember } from '../../types';
import { Users, ChevronRight, Activity, Calendar, FileText, HeartPulse, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface CareCircleWidgetProps {
  members: CareMember[];
  activeMemberId: string;
  onSelectMember: (id: string) => void;
  onViewJourney: (memberId: string) => void;
  onManageCareCircle: () => void;
  onAddMember: () => void;
}

export const CareCircleWidget: React.FC<CareCircleWidgetProps> = ({
  members,
  activeMemberId,
  onSelectMember,
  onViewJourney,
  onManageCareCircle,
  onAddMember,
}) => {
  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'stable':
        return 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
      case 'followup_due':
        return 'bg-[#FFF8E1] text-[#B78103] border-[#FFE082]';
      case 'lab_ready':
        return 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]';
      case 'medication_active':
        return 'bg-[#F3E5F5] text-[#7B1FA2] border-[#E1BEE7]';
      default:
        return 'bg-[#F7F9F8] text-[#708188] border-[#DCE6E7]';
    }
  };

  return (
    <section className="bg-white rounded-[20px] p-5 shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#DCE6E7] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0B6875]/10 flex items-center justify-center text-[#0B6875]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#16343C]">Care Circle & Family Health</h2>
            <p className="text-xs text-[#708188]">Manage health status for dependents</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onManageCareCircle}
          className="text-xs font-bold text-[#0B6875] hover:text-[#084F59] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Manage Circle</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Member Avatar Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {members.map((member) => {
          const isSelected = member.id === activeMemberId;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember(member.id)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border',
                isSelected
                  ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-sm scale-[1.02]'
                  : 'bg-[#F7F9F8] text-[#708188] border-[#DCE6E7] hover:bg-[#EAEFEF] hover:text-[#16343C]'
              )}
            >
              <div
                className={clsx(
                  'w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center',
                  isSelected ? 'bg-white text-[#0B6875]' : 'bg-[#DCE6E7] text-[#16343C]'
                )}
              >
                {member.avatarInitials}
              </div>
              <span>{member.relationshipLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddMember}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#0B6875] bg-[#0B6875]/10 border border-[#0B6875]/30 hover:bg-[#0B6875]/20 shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Selected Member Summary Card */}
      {activeMember && (
        <div className="bg-[#F7F9F8] rounded-2xl p-4 border border-[#DCE6E7] flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#16343C]">{activeMember.fullName}</h3>
                <span className="text-xs text-[#708188]">({activeMember.gender}, {activeMember.age}y)</span>
              </div>
              <p className="text-xs text-[#708188] font-medium mt-0.5">MRN: {activeMember.mrn}</p>
            </div>

            <span
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide',
                getStatusBadgeClass(activeMember.activeStatus)
              )}
            >
              {activeMember.activeStatusText}
            </span>
          </div>

          {/* Vitals Snapshot */}
          <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-[#DCE6E7]/80">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-[#C94B4B]" />
                BP
              </span>
              <span className="text-xs font-bold text-[#16343C] mt-0.5">{activeMember.lastVitals.bloodPressure}</span>
            </div>

            <div className="flex flex-col border-l border-[#DCE6E7] pl-3">
              <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#0B6875]" />
                Heart Rate
              </span>
              <span className="text-xs font-bold text-[#16343C] mt-0.5">{activeMember.lastVitals.heartRate} bpm</span>
            </div>

            <div className="flex flex-col border-l border-[#DCE6E7] pl-3">
              <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#23866A]" />
                SpO2
              </span>
              <span className="text-xs font-bold text-[#16343C] mt-0.5">{activeMember.lastVitals.spo2}%</span>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center justify-between text-xs text-[#708188]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#0B6875]" />
                {activeMember.activeAppointmentsCount} Appt
              </span>
              <span className="flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-[#0B6875]" />
                {activeMember.activePrescriptionsCount} Rx Active
              </span>
            </div>

            <button
              type="button"
              onClick={() => onViewJourney(activeMember.id)}
              className="bg-[#0B6875] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#084F59] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>View Journey</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
