import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { PageState } from '../../components/ui/PageState';
import { Bell, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const NotificationPreferences: React.FC = () => {
  const { permission, requestPermission } = useNotificationPermission();

  const { data, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => notificationService.getPreferences(),
  });

  const prefs = data?.data;

  const [queueAlerts, setQueueAlerts] = useState(true);
  const [rxAlerts, setRxAlerts] = useState(true);
  const [labAlerts, setLabAlerts] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Notification Settings" />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isLoading}>
          <div className="space-y-4">
            {/* Device Permission Banner */}
            <AppCard className="bg-[#DFF3F5]/30 border-[#0B6875]/30">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xs font-bold text-[#16343C]">Browser Device Permissions</h2>
                  <p className="text-[11px] text-[#708188] mt-0.5">
                    Permission Status: <strong className="uppercase text-[#0B6875]">{permission}</strong>
                  </p>
                </div>
                {permission !== 'granted' && (
                  <AppButton size="small" onClick={requestPermission}>
                    Enable
                  </AppButton>
                )}
              </div>
            </AppCard>

            {/* Toggle Preferences */}
            <AppCard className="space-y-3">
              <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider">Patient Account Preferences</h2>

              <div className="flex items-center justify-between py-2 border-b border-[#F7F9F8]">
                <div>
                  <p className="text-xs font-bold text-[#16343C]">Live Queue & Token Alerts</p>
                  <p className="text-[11px] text-[#708188]">High-priority popup when your turn arrives</p>
                </div>
                <input
                  type="checkbox"
                  checked={queueAlerts}
                  onChange={(e) => setQueueAlerts(e.target.checked)}
                  className="rounded text-[#0B6875] w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F7F9F8]">
                <div>
                  <p className="text-xs font-bold text-[#16343C]">Prescription Availability</p>
                  <p className="text-[11px] text-[#708188]">Alerts when new doctor prescription is ready</p>
                </div>
                <input
                  type="checkbox"
                  checked={rxAlerts}
                  onChange={(e) => setRxAlerts(e.target.checked)}
                  className="rounded text-[#0B6875] w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-[#16343C]">Lab Report Notifications</p>
                  <p className="text-[11px] text-[#708188]">Updates on diagnostic report reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={labAlerts}
                  onChange={(e) => setLabAlerts(e.target.checked)}
                  className="rounded text-[#0B6875] w-5 h-5"
                />
              </div>
            </AppCard>
          </div>
        </PageState>
      </ScreenContainer>
    </div>
  );
};
