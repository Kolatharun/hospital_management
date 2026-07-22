import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { prescriptionService } from '../../services/prescriptionService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageState } from '../../components/ui/PageState';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Pill, Stethoscope, Send, Download, FileText, Sun, SunMedium, Moon, Utensils } from 'lucide-react';

export const PrescriptionDetails: React.FC = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const nav = useAppNavigation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => prescriptionService.getPrescriptionById(prescriptionId || 'rx-701'),
  });

  const rx = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Prescription Details" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {rx && (
            <div className="space-y-4 pb-16">
              {/* Doctor Info */}
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-[14px] bg-[#23866A]/10 text-[#23866A] flex items-center justify-center shrink-0">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-[#16343C]">{rx.doctorName}</h1>
                      <p className="text-xs text-[#708188]">{rx.doctorSpeciality}</p>
                      <p className="text-[11px] text-[#708188] mt-1">Consultation Date: {formatDate(rx.consultationDate)}</p>
                    </div>
                  </div>
                  <StatusBadge label={rx.status === 'active' ? 'Active Rx' : rx.status} variant="success" />
                </div>
              </AppCard>

              {/* Medicines List */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider px-1">Prescribed Medicines ({rx.medicines.length})</h2>

                {rx.medicines.map((med) => (
                  <AppCard key={med.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-[#16343C]">{med.medicineName}</h3>
                        <span className="text-xs font-semibold text-[#0B6875]">{med.strength} • {med.form}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#708188] bg-[#F7F9F8] px-2 py-0.5 rounded">
                        {med.durationDays} Days
                      </span>
                    </div>

                    {/* Dosing Schedule Pill Indicators */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#F7F9F8]">
                      <div className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded ${med.dosageSchedule.morning ? 'bg-[#23866A]/10 text-[#23866A] font-bold' : 'bg-gray-100 text-gray-400'}`}>
                        <Sun className="w-3.5 h-3.5" /> Morning
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded ${med.dosageSchedule.afternoon ? 'bg-[#23866A]/10 text-[#23866A] font-bold' : 'bg-gray-100 text-gray-400'}`}>
                        <SunMedium className="w-3.5 h-3.5" /> Afternoon
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded ${med.dosageSchedule.night ? 'bg-[#23866A]/10 text-[#23866A] font-bold' : 'bg-gray-100 text-gray-400'}`}>
                        <Moon className="w-3.5 h-3.5" /> Night
                      </div>
                    </div>

                    <div className="text-[11px] text-[#708188] flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-[#0B6875]" />
                      <span>{med.foodRelation.replace('_', ' ').toUpperCase()} • {med.specialInstructions}</span>
                    </div>
                  </AppCard>
                ))}
              </div>

              {/* Special Advice */}
              {rx.specialAdvice && (
                <AppCard className="bg-[#DFF3F5]/30 border-[#0B6875]/20">
                  <h2 className="text-xs font-bold text-[#0B6875] uppercase tracking-wider mb-1">Doctor's Lifestyle Advice</h2>
                  <p className="text-xs text-[#16343C]">{rx.specialAdvice}</p>
                </AppCard>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <AppButton
                  size="full-width"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => nav.navigate(`/prescriptions/${rx.id}/pharmacy`)}
                >
                  Send to Connected Pharmacy
                </AppButton>

                <AppButton
                  size="full-width"
                  variant="outline"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => nav.goToDocument('doc-rx-701')}
                >
                  View Signed Prescription PDF
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
