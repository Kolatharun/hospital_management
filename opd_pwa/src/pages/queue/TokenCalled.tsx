import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queueService } from '../../services/queueService';
import { AppButton } from '../../components/ui/AppButton';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Bell, MapPin, ArrowRight, HelpCircle } from 'lucide-react';

export const TokenCalled: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();

  const { data } = useQuery({
    queryKey: ['liveQueue', appointmentId],
    queryFn: () => queueService.getQueueState(appointmentId || 'apt-501'),
  });

  const queue = data?.data;

  return (
    <div className="min-h-screen bg-[#0B6875] text-white flex flex-col justify-between p-6 animate-pulse-glow z-50 fixed inset-0">
      {/* Alert Header */}
      <div className="text-center pt-8">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Bell className="w-10 h-10 text-white" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-[#DFF3F5]">High Priority OPD Alert</span>
        <h1 className="text-2xl font-black mt-1">YOUR TOKEN HAS BEEN CALLED!</h1>
      </div>

      {/* Main Token Display */}
      <div className="bg-white text-[#16343C] rounded-[24px] p-6 text-center shadow-2xl my-auto max-w-sm mx-auto w-full">
        <p className="text-xs font-bold text-[#708188] uppercase tracking-wider">Token Number</p>
        <h2 className="text-6xl font-black text-[#0B6875] tracking-tight my-2">{queue?.myToken || 'B-14'}</h2>

        <div className="my-4 pt-4 border-t border-[#DCE6E7] text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#708188]">Doctor:</span>
            <span className="font-bold text-[#16343C]">{queue?.doctorName || 'Dr. Ananya Rao'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#708188]">Chamber / Room:</span>
            <span className="font-extrabold text-[#0B6875] text-sm bg-[#DFF3F5] px-2 py-0.5 rounded">
              {queue?.roomNumber || 'OPD Room 104'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#708188]">Please proceed directly into the doctor's room now.</p>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-3 pb-6 max-w-sm mx-auto w-full">
        <AppButton
          size="full-width"
          variant="secondary"
          className="bg-white text-[#0B6875] font-extrabold text-base h-14"
          rightIcon={<ArrowRight className="w-5 h-5" />}
          onClick={nav.goHome}
        >
          I'm Going to the Room
        </AppButton>

        <button
          type="button"
          onClick={nav.goToSupport}
          className="w-full text-center text-xs text-[#DFF3F5] font-semibold hover:underline flex items-center justify-center gap-1.5 pt-1"
        >
          <HelpCircle className="w-4 h-4" />
          <span>I Need Assistance / Wheelchair</span>
        </button>
      </div>
    </div>
  );
};
