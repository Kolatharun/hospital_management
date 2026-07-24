import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { CareMember, EmergencyAlertResponse } from '../../types';
import { HOSPITAL_EMERGENCY_CONFIG, emergencyService } from '../../services/emergencyService';
import { EmergencyAlertStatusModal } from './EmergencyAlertStatusModal';
import { PhoneCall, Siren, ShieldAlert, Check, Loader2, Hospital, UserCheck } from 'lucide-react';

interface EmergencyHelpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  careMembers: CareMember[];
  activePatientId: string;
  onSelectPatient?: (id: string) => void;
}

export const EmergencyHelpSheet: React.FC<EmergencyHelpSheetProps> = ({
  isOpen,
  onClose,
  careMembers,
  activePatientId,
  onSelectPatient,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(activePatientId);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const [alertResponse, setAlertResponse] = useState<EmergencyAlertResponse | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

  const selectedPatient = careMembers.find((m) => m.id === selectedPatientId) || careMembers[0];

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    if (onSelectPatient) {
      onSelectPatient(id);
    }
  };

  const handleCall112 = () => {
    window.location.href = 'tel:112';
  };

  const handleCallHospital = () => {
    window.location.href = `tel:${HOSPITAL_EMERGENCY_CONFIG.hospitalHotline}`;
  };

  const handleSendHospitalAlert = async () => {
    if (!selectedPatient) return;
    setIsAlerting(true);
    try {
      const response = await emergencyService.sendEmergencyAlert({
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        relation: selectedPatient.relationshipLabel,
        requestorMobile: selectedPatient.emergencyContact,
        notes: 'Immediate emergency alert triggered from patient PWA.',
      });
      setAlertResponse(response);
      setIsStatusModalOpen(true);
    } catch (err) {
      console.error('ER Alert error:', err);
      setAlertResponse({
        alertId: `EMG-ERR-${Date.now()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        timestamp: new Date().toISOString(),
        status: 'failed',
        hotlineFallback: HOSPITAL_EMERGENCY_CONFIG.hospitalHotline,
        message: 'Alert failed due to connection issue. Please use direct call below.',
      });
      setIsStatusModalOpen(true);
    } finally {
      setIsAlerting(false);
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} showCloseButton={true}>
        <div className="flex flex-col gap-5">
          {/* Header Banner */}
          <div className="bg-[#BA1A1A] text-white p-4 -mx-5 -mt-5 rounded-t-[24px] flex items-start gap-3 shadow-md">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              <Siren className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Emergency Help</h2>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                For immediate medical danger, contact emergency services now.
              </p>
            </div>
          </div>

          {/* Patient Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#708188] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0B6875]" />
                Requesting help for
              </label>
              <span className="text-[11px] font-semibold text-[#0B6875] bg-[#0B6875]/10 px-2 py-0.5 rounded-full">
                {selectedPatient?.relationshipLabel || 'Myself'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {careMembers.map((member) => {
                const isSelected = member.id === selectedPatientId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handlePatientSelect(member.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0B6875] bg-[#DFF3F5]/60 ring-2 ring-[#0B6875]/30'
                        : 'border-[#DCE6E7] bg-white hover:bg-[#F7F9F8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0B6875] text-white' : 'bg-[#EAEFEF] text-[#708188]'
                        }`}
                      >
                        {member.avatarInitials}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-[#16343C] truncate">{member.fullName}</span>
                        <span className="text-[10px] text-[#708188]">{member.relationshipLabel}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0B6875] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action List (Prioritized) */}
          <div className="flex flex-col gap-3">
            {/* Action 1: Call 112 (Primary) */}
            <button
              type="button"
              onClick={handleCall112}
              className="w-full bg-[#BA1A1A] hover:bg-[#93000A] text-white p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-lg group min-h-[58px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base font-bold text-white">Call 112 now</span>
                  <span className="text-xs text-white/80 font-medium">National Emergency Services</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold tracking-wider">
                FREE
              </span>
            </button>

            {/* Action 2: Call Hospital Emergency (Secondary) */}
            <button
              type="button"
              onClick={handleCallHospital}
              className="w-full bg-[#0B6875] hover:bg-[#084F59] text-white p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-md min-h-[54px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <Hospital className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-white">Call Balaji Heart Center Hotline</span>
                  <span className="text-xs text-white/80 font-medium">{HOSPITAL_EMERGENCY_CONFIG.hospitalHotline}</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-white/90">24/7 ER Desk</span>
            </button>

            {/* Action 3: Alert ER Team (Tertiary) */}
            <button
              type="button"
              onClick={handleSendHospitalAlert}
              disabled={isAlerting}
              className="w-full bg-[#F7F9F8] border-2 border-[#0B6875] hover:bg-[#DFF3F5]/40 text-[#0B6875] p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer min-h-[54px] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B6875]/10 flex items-center justify-center text-[#0B6875] shrink-0">
                  {isAlerting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-[#16343C]">Alert ER Triage Team</span>
                  <span className="text-xs text-[#708188]">
                    Send patient MRN ({selectedPatient?.mrn}) & live signal to ER
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0B6875] bg-[#0B6875]/10 px-2.5 py-1 rounded-lg">
                Transmit
              </span>
            </button>
          </div>

          <div className="text-[11px] text-[#708188] text-center bg-[#F7F9F8] p-2.5 rounded-xl border border-[#DCE6E7]">
            Note: Phone calls connect directly to emergency operators and function even without cellular data.
          </div>
        </div>
      </BottomSheet>

      {/* ER Alert Feedback Modal */}
      <EmergencyAlertStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        response={alertResponse}
      />
    </>
  );
};
