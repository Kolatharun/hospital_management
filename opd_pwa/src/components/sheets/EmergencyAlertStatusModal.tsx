import React from 'react';
import { EmergencyAlertResponse } from '../../types';
import { CheckCircle2, Phone, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface EmergencyAlertStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: EmergencyAlertResponse | null;
}

export const EmergencyAlertStatusModal: React.FC<EmergencyAlertStatusModalProps> = ({
  isOpen,
  onClose,
  response,
}) => {
  if (!isOpen || !response) return null;

  const isSuccess = response.status !== 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-[420px] p-6 shadow-2xl border border-[#DCE6E7] relative flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#708188] hover:bg-[#F7F9F8] hover:text-[#16343C] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-3 ring-8 ring-[#E8F5E9]/50 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-[#16343C]">Emergency Alert Transmitted</h3>
            <p className="text-sm text-[#708188] mt-1">
              Ref ID: <span className="font-semibold text-[#0B6875]">{response.alertId}</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFEBEE] text-[#C94B4B] flex items-center justify-center mb-3 ring-8 ring-[#FFEBEE]/50">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-[#C94B4B]">Network Connection Offline</h3>
            <p className="text-sm text-[#708188] mt-1">
              Unable to reach hospital server. Please call hotline directly.
            </p>
          </div>
        )}

        <div className="bg-[#F7F9F8] rounded-2xl p-4 border border-[#DCE6E7] flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#DCE6E7] pb-2">
            <span className="text-[#708188] font-medium">Patient</span>
            <span className="font-bold text-[#16343C]">{response.patientName}</span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-[#DCE6E7] pb-2">
            <span className="text-[#708188] font-medium">ER Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0B6875]/10 text-[#0B6875] font-bold uppercase text-[10px] tracking-wider">
              {response.status.replace('_', ' ')}
            </span>
          </div>

          {response.assignedDoctorOrERTeam && (
            <div className="flex justify-between items-center text-xs border-b border-[#DCE6E7] pb-2">
              <span className="text-[#708188] font-medium">Assigned ER Desk</span>
              <span className="font-semibold text-[#16343C] text-right">{response.assignedDoctorOrERTeam}</span>
            </div>
          )}

          {response.estimatedArrivalMinutes && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#708188] font-medium">Triage Priority Window</span>
              <span className="font-bold text-[#0B6875]">~{response.estimatedArrivalMinutes} mins</span>
            </div>
          )}
        </div>

        <div className="bg-[#FFEBEE] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#93000A]">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#C94B4B] mt-0.5" />
          <p className="leading-snug">
            {response.message || 'If condition deteriorates, call National Emergency 112 immediately.'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={`tel:${response.hotlineFallback}`}
            className="w-full bg-[#0B6875] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#084F59] transition-colors cursor-pointer shadow-md text-center"
          >
            <Phone className="w-4 h-4" />
            <span>Call Hospital Emergency ({response.hotlineFallback})</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#F7F9F8] text-[#708188] py-2.5 rounded-xl font-semibold text-xs hover:bg-[#EAEFEF] transition-colors cursor-pointer text-center"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
