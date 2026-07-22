import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { recordService } from '../../services/recordService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { PageState } from '../../components/ui/PageState';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { FileText, Stethoscope, Pill, Calendar, Activity, Eye, Download } from 'lucide-react';

export const VisitDetails: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const nav = useAppNavigation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => recordService.getVisitById(visitId || 'vis-301'),
  });

  const visit = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Consultation Summary" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {visit && (
            <div className="space-y-4">
              {/* Doctor Header */}
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-[16px] bg-[#DFF3F5] text-[#0B6875] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-[#16343C]">{visit.doctorName}</h1>
                    <p className="text-xs font-semibold text-[#0B6875]">{visit.doctorSpeciality}</p>
                    <p className="text-[11px] text-[#708188] mt-1">Consultation Date: {formatDate(visit.date)}</p>
                  </div>
                </div>
              </AppCard>

              {/* Diagnosis */}
              <AppCard>
                <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2">Patient Diagnosis</h2>
                <p className="text-xs font-semibold text-[#0B6875] bg-[#DFF3F5]/60 p-3 rounded-[12px]">
                  {visit.patientVisibleDiagnosis}
                </p>
              </AppCard>

              {/* Chief Complaint */}
              <AppCard>
                <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2">Chief Complaint Notes</h2>
                <p className="text-xs text-[#708188] leading-relaxed">{visit.chiefComplaint}</p>
              </AppCard>

              {/* Recorded Vitals */}
              <AppCard>
                <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#0B6875]" /> Clinical Vitals
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#F7F9F8] p-2.5 rounded-[10px]">
                    <span className="text-[#708188] text-[10px]">Blood Pressure</span>
                    <p className="font-bold text-[#16343C]">{visit.vitals.bloodPressure}</p>
                  </div>
                  <div className="bg-[#F7F9F8] p-2.5 rounded-[10px]">
                    <span className="text-[#708188] text-[10px]">Pulse Rate</span>
                    <p className="font-bold text-[#16343C]">{visit.vitals.pulseRate}</p>
                  </div>
                  <div className="bg-[#F7F9F8] p-2.5 rounded-[10px]">
                    <span className="text-[#708188] text-[10px]">Weight</span>
                    <p className="font-bold text-[#16343C]">{visit.vitals.weightKg}</p>
                  </div>
                  <div className="bg-[#F7F9F8] p-2.5 rounded-[10px]">
                    <span className="text-[#708188] text-[10px]">SpO2</span>
                    <p className="font-bold text-[#16343C]">{visit.vitals.spO2}</p>
                  </div>
                </div>
              </AppCard>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {visit.prescriptionId && (
                  <AppButton
                    size="full-width"
                    leftIcon={<Pill className="w-4 h-4" />}
                    onClick={() => nav.goToPrescription(visit.prescriptionId!)}
                  >
                    View Prescribed Medicines
                  </AppButton>
                )}

                <AppButton
                  size="full-width"
                  variant="outline"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => nav.goToDocument('doc-vis-301')}
                >
                  View Signed OPD Paper (PDF)
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
