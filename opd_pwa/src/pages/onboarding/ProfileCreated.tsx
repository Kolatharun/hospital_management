import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { AppButton } from '../../components/ui/AppButton';
import { CheckCircle2, Calendar, Home } from 'lucide-react';

export const ProfileCreated: React.FC = () => {
  const { patient } = useAuth();
  const { goHome, goToDoctorDetails } = useAppNavigation();

  return (
    <div className="flex flex-col min-h-full justify-center py-6 text-center">
      <div className="bg-white rounded-[24px] border border-[#DCE6E7] p-6 shadow-sm">
        <div className="w-16 h-16 bg-[#23866A]/10 rounded-full flex items-center justify-center text-[#23866A] mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h1 className="text-xl font-black text-[#16343C]">Account Created Successfully!</h1>
        <p className="text-xs text-[#708188] mt-1">Welcome to Balaji Heart Center OPD Patient Services.</p>

        <div className="bg-[#F7F9F8] rounded-[16px] border border-[#DCE6E7] p-4 my-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#708188]">Patient Name:</span>
            <span className="font-bold text-[#16343C]">{patient?.fullName || 'Rajesh K. Sharma'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#708188]">MR Number:</span>
            <span className="font-extrabold text-[#0B6875] bg-[#DFF3F5] px-2 py-0.5 rounded">{patient?.mrNumber || 'MR-2026-8842'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#708188]">Registered Mobile:</span>
            <span className="font-medium text-[#16343C]">+91 {patient?.mobile}</span>
          </div>
        </div>

        <div className="space-y-3">
          <AppButton variant="primary" size="full-width" leftIcon={<Home className="w-5 h-5" />} onClick={goHome}>
            Go to Home Dashboard
          </AppButton>
          <AppButton variant="outline" size="full-width" leftIcon={<Calendar className="w-5 h-5" />} onClick={() => goToDoctorDetails('doc-1')}>
            Book Doctor Appointment
          </AppButton>
        </div>
      </div>
    </div>
  );
};
