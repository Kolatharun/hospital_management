import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pharmacyService } from '../../services/pharmacyService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageState } from '../../components/ui/PageState';
import { getPharmacyStatusStyle } from '../../utils/status';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Building2, CheckCircle2, PhoneCall, Clock, RefreshCw } from 'lucide-react';

export const PharmacyRequestStatus: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const nav = useAppNavigation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pharmacyRequest', requestId],
    queryFn: () => pharmacyService.getPharmacyRequestById(requestId || 'ph-req-901'),
    refetchInterval: 5000,
  });

  const req = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Pharmacy Request Status" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {req && (
            <div className="space-y-4">
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white text-center p-6">
                <div className="w-14 h-14 bg-[#23866A]/10 text-[#23866A] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7" />
                </div>
                <h1 className="text-base font-bold text-[#16343C]">{req.pharmacyName}</h1>
                <p className="text-xs text-[#708188] mt-0.5">Order ID: <strong className="text-[#16343C]">{req.id}</strong></p>

                <div className="mt-4 pt-3 border-t border-[#DCE6E7] flex justify-center">
                  <StatusBadge {...getPharmacyStatusStyle(req.status)} />
                </div>
              </AppCard>

              {/* Status Notes */}
              {req.pharmacistNotes && (
                <AppCard className="bg-[#23866A]/10 border-[#23866A]/30">
                  <h2 className="text-xs font-bold text-[#23866A] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Pharmacist Update
                  </h2>
                  <p className="text-xs text-[#16343C] font-medium leading-relaxed">{req.pharmacistNotes}</p>
                </AppCard>
              )}

              {/* Delivery Details */}
              <AppCard className="space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#F7F9F8]">
                  <span className="text-[#708188]">Fulfillment Type:</span>
                  <span className="font-bold text-[#16343C] uppercase">{req.fulfillmentType.replace('_', ' ')}</span>
                </div>
                {req.deliveryAddress && (
                  <div className="flex justify-between items-start pb-2 border-b border-[#F7F9F8]">
                    <span className="text-[#708188]">Address:</span>
                    <span className="font-semibold text-[#16343C] text-right max-w-[200px]">{req.deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[#708188]">Pharmacy Helpline:</span>
                  <span className="font-semibold text-[#0B6875]">{req.pharmacyPhone}</span>
                </div>
              </AppCard>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <a
                  href={`tel:${req.pharmacyPhone}`}
                  className="w-full h-12 bg-white border border-[#DCE6E7] rounded-[14px] font-semibold text-xs text-[#16343C] flex items-center justify-center gap-2 hover:bg-[#F7F9F8]"
                >
                  <PhoneCall className="w-4 h-4 text-[#0B6875]" /> Call Clinic Pharmacy
                </a>

                <AppButton size="full-width" variant="ghost" onClick={nav.goHome}>
                  Back to Home Dashboard
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
