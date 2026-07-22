import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../hooks/useSocket';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Sparkles, Users, Clock, MapPin, Bell, AlertOctagon } from 'lucide-react';

export const LiveQueue: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();

  // Socket.IO simulated connection
  useSocket(appointmentId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['liveQueue', appointmentId],
    queryFn: () => queueService.getQueueState(appointmentId || 'apt-501'),
    refetchInterval: 5000,
  });

  const queue = data?.data;

  // Auto-trigger token called screen if status is calling
  useEffect(() => {
    if (queue?.status === 'calling') {
      nav.goToTokenCalled(appointmentId || 'apt-501');
    }
  }, [queue?.status, appointmentId, nav]);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Live Queue Status" subtitle="Real-time OPD Tracker" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {queue && (
            <div className="space-y-4">
              {/* Token Hero Banner */}
              <AppCard className="bg-gradient-to-b from-[#0B6875] to-[#084F59] text-white text-center p-6 shadow-md border-none">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#DFF3F5]/90 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Your Queue Token
                </span>
                <h1 className="text-5xl font-black tracking-tight my-2 text-white">{queue.myToken}</h1>

                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 rounded-[12px] p-2.5">
                    <p className="text-white/70 text-[10px] uppercase font-semibold">Now Serving</p>
                    <p className="text-xl font-bold text-white mt-0.5">{queue.currentServingToken}</p>
                  </div>
                  <div className="bg-white/10 rounded-[12px] p-2.5">
                    <p className="text-white/70 text-[10px] uppercase font-semibold">Patients Ahead</p>
                    <p className="text-xl font-bold text-[#DFF3F5] mt-0.5">{queue.patientsAhead}</p>
                  </div>
                </div>
              </AppCard>

              {/* Estimated Wait Card */}
              <AppCard className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#DFF3F5] text-[#0B6875] rounded-[14px]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#708188] uppercase">Estimated Wait</h2>
                    <p className="text-base font-extrabold text-[#16343C]">~{queue.estimatedWaitMinutes} Minutes</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#23866A] bg-[#23866A]/10 px-2.5 py-1 rounded-full">
                  Moving Smoothly
                </span>
              </AppCard>

              {/* Doctor Chamber Details */}
              <AppCard className="space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Attending Doctor:</span>
                  <span className="font-bold text-[#16343C]">{queue.doctorName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Consultation Chamber:</span>
                  <span className="font-semibold text-[#0B6875]">{queue.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#708188]">Last Updated:</span>
                  <span className="text-[#708188] font-medium">{queue.lastUpdated}</span>
                </div>
              </AppCard>

              {/* Quick Action Simulation Buttons */}
              <div className="pt-2 space-y-2">
                <AppButton
                  size="full-width"
                  variant="outline"
                  leftIcon={<Bell className="w-4 h-4 text-[#0B6875]" />}
                  onClick={() => nav.goToTokenCalled(appointmentId || 'apt-501')}
                >
                  Simulate Token Called Alert
                </AppButton>

                <AppButton
                  size="full-width"
                  variant="ghost"
                  className="text-[#C94B4B]"
                  leftIcon={<AlertOctagon className="w-4 h-4" />}
                  onClick={() => nav.navigate(`/queue/${appointmentId}/missed`)}
                >
                  View Missed Turn Recovery
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
