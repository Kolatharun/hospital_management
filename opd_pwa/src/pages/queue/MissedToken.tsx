import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queueService } from '../../services/queueService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { AlertCircle, RefreshCw, PhoneCall, CheckCircle2 } from 'lucide-react';

export const MissedToken: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const nav = useAppNavigation();

  const [requested, setRequested] = useState(false);

  const { data } = useQuery({
    queryKey: ['liveQueue', appointmentId],
    queryFn: () => queueService.getQueueState(appointmentId || 'apt-501'),
  });

  const recoveryMutation = useMutation({
    mutationFn: () => queueService.requestRecovery(appointmentId || 'apt-501'),
    onSuccess: () => {
      setRequested(true);
    },
  });

  const queue = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Missed Turn Recovery" />

      <ScreenContainer hasBottomNav={true}>
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-[#C94B4B]/10 rounded-full flex items-center justify-center text-[#C94B4B] mx-auto my-2">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-extrabold text-[#16343C]">Turn Missed — Token {queue?.myToken || 'B-14'}</h1>
          <p className="text-xs text-[#708188] max-w-xs mx-auto">
            Your token was called while you were away from OPD Chamber {queue?.roomNumber || 'Room 104'}.
          </p>

          {!requested ? (
            <AppCard className="text-left space-y-4 my-4">
              <div className="text-xs text-[#708188] space-y-1">
                <p><strong>Doctor:</strong> {queue?.doctorName || 'Dr. Ananya Rao'}</p>
                <p><strong>Status:</strong> Passed token</p>
              </div>

              <div className="pt-2">
                <AppButton
                  size="full-width"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  isLoading={recoveryMutation.isPending}
                  onClick={() => recoveryMutation.mutate()}
                >
                  Request Turn Recovery
                </AppButton>
              </div>
            </AppCard>
          ) : (
            <AppCard className="bg-[#23866A]/10 border-[#23866A]/30 text-left my-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#23866A]">
                <CheckCircle2 className="w-5 h-5" /> Recovery Request Submitted
              </div>
              <p className="text-xs text-[#16343C]">
                The reception desk has been notified. You have been placed back in queue after 1 patient. Please report to Front Desk.
              </p>
              <AppButton size="small" variant="secondary" onClick={() => nav.goToQueueTrack(appointmentId || 'apt-501')}>
                Return to Live Queue
              </AppButton>
            </AppCard>
          )}

          <div className="pt-4 border-t border-[#DCE6E7]">
            <a
              href="tel:+912225001122"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#0B6875] hover:underline"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Front Desk: +91 22 2500 1122</span>
            </a>
          </div>
        </div>
      </ScreenContainer>
    </div>
  );
};
