import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { prescriptionService } from '../../services/prescriptionService';
import { pharmacyService } from '../../services/pharmacyService';
import { useAuth } from '../../hooks/useAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Building2, ShieldCheck, MapPin, Phone, Send } from 'lucide-react';

export const SendToPharmacy: React.FC = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const { patient } = useAuth();
  const nav = useAppNavigation();

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'home_delivery'>('pickup');
  const [address, setAddress] = useState(patient?.address || '402, Sunshine Heights, Dadar West, Mumbai');
  const [consent, setConsent] = useState(true);

  const { data: rxRes, isLoading } = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => prescriptionService.getPrescriptionById(prescriptionId || 'rx-701'),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      pharmacyService.sendPrescriptionToPharmacy({
        prescriptionId: prescriptionId || 'rx-701',
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'home_delivery' ? address : undefined,
      }),
    onSuccess: (res) => {
      nav.navigate(`/pharmacy/requests/${res.data.id}`);
    },
  });

  const rx = rxRes?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Send Prescription to Pharmacy" />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isLoading}>
          {rx && (
            <div className="space-y-4 pb-20">
              {/* Verified Pharmacy Info */}
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/40 to-white border-[#0B6875]/30">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-[#0B6875] text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#16343C]">Balaji Heart Center In-House Pharmacy</h2>
                    <p className="text-xs text-[#0B6875] font-semibold">Verified OPD Clinic Partner Pharmacy</p>
                    <p className="text-[11px] text-[#708188] flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" /> +91 22 2500 1122 • Counter 2
                    </p>
                  </div>
                </div>
              </AppCard>

              {/* Fulfillment Type */}
              <AppCard>
                <label className="text-xs font-bold text-[#16343C] mb-2 block">Collection Option</label>
                <SegmentedControl
                  options={[
                    { label: 'OPD Counter Pickup', value: 'pickup' },
                    { label: 'Home Delivery', value: 'home_delivery' },
                  ]}
                  value={fulfillmentType}
                  onChange={setFulfillmentType}
                />

                {fulfillmentType === 'home_delivery' && (
                  <div className="mt-3">
                    <AppInput
                      label="Delivery Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                )}
              </AppCard>

              {/* Prescription Summary */}
              <AppCard>
                <h3 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2">Prescription Items ({rx.medicines.length})</h3>
                <div className="space-y-1.5 text-xs">
                  {rx.medicines.map((m) => (
                    <div key={m.id} className="flex justify-between py-1 border-b border-[#F7F9F8]">
                      <span className="font-semibold text-[#16343C]">{m.medicineName} {m.strength}</span>
                      <span className="text-[#708188]">{m.durationDays} Days</span>
                    </div>
                  ))}
                </div>
              </AppCard>

              {/* Required Consent */}
              <div className="bg-[#F7F9F8] border border-[#DCE6E7] rounded-[14px] p-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[#0B6875]"
                  />
                  <span className="text-xs text-[#708188]">
                    I authorize Balaji Heart Center to share my prescription with the clinic pharmacy for medicine preparation.
                  </span>
                </label>
              </div>

              {/* Sticky Send Action */}
              <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom">
                <div className="w-full max-w-[480px]">
                  <AppButton
                    size="full-width"
                    disabled={!consent}
                    isLoading={sendMutation.isPending}
                    leftIcon={<Send className="w-4 h-4" />}
                    onClick={() => sendMutation.mutate()}
                  >
                    Transmit Prescription Order
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
