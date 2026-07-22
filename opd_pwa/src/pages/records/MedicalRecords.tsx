import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recordService } from '../../services/recordService';
import { useAuth } from '../../hooks/useAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PageState } from '../../components/ui/PageState';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { FileText, Activity, TestTube, ChevronRight, Download, Calendar } from 'lucide-react';

export const MedicalRecords: React.FC = () => {
  const { patient } = useAuth();
  const nav = useAppNavigation();
  const [tab, setTab] = useState<'visits' | 'labs'>('visits');

  const { data: visitsRes, isLoading: isVisitsLoading, isError: isVisitsError, refetch: refetchVisits } = useQuery({
    queryKey: ['visits'],
    queryFn: () => recordService.getVisits(),
  });

  const { data: labsRes, isLoading: isLabsLoading, isError: isLabsError, refetch: refetchLabs } = useQuery({
    queryKey: ['labs'],
    queryFn: () => recordService.getLabReports(),
  });

  const visits = visitsRes?.data || [];
  const labs = labsRes?.data || [];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Medical Records" showBack={false} />

      <ScreenContainer hasBottomNav={true}>
        {/* Patient Identity Banner */}
        <AppCard className="bg-[#DFF3F5]/30 border-[#0B6875]/20 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#16343C]">{patient?.fullName || 'Rajesh K. Sharma'}</p>
              <p className="text-[#708188] text-[11px]">MR: <span className="text-[#0B6875] font-extrabold">{patient?.mrNumber || 'MR-2026-8842'}</span></p>
            </div>
            <span className="bg-white border border-[#0B6875]/20 text-[#0B6875] font-semibold px-2.5 py-1 rounded-full text-[11px]">
              Verified Patient
            </span>
          </div>
        </AppCard>

        {/* Tab Selection */}
        <div className="mb-4">
          <SegmentedControl
            options={[
              { label: 'Consultation Visits', value: 'visits' },
              { label: 'Lab & Diagnostic Reports', value: 'labs' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'visits' ? (
          <PageState
            isLoading={isVisitsLoading}
            isError={isVisitsError}
            isEmpty={visits.length === 0}
            errorProps={{ onRetry: refetchVisits }}
            emptyProps={{
              title: 'No Visit History',
              description: 'Past consultation notes will appear here after your doctor visit.',
            }}
          >
            <div className="space-y-3.5">
              {visits.map((vis) => (
                <AppCard
                  key={vis.id}
                  variant="interactive"
                  onClick={() => nav.navigate(`/records/visits/${vis.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#0B6875]/10 text-[#0B6875] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#16343C]">{vis.doctorName}</h2>
                        <p className="text-xs text-[#708188]">{vis.doctorSpeciality}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#708188] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0B6875]" /> {formatDate(vis.date)}
                    </span>
                  </div>

                  <div className="bg-[#F7F9F8] rounded-[12px] p-2.5 my-3 text-xs space-y-1">
                    <p className="text-[#708188]">Diagnosis: <strong className="text-[#16343C]">{vis.patientVisibleDiagnosis}</strong></p>
                    <p className="text-[#708188]">BP: <strong className="text-[#16343C]">{vis.vitals.bloodPressure}</strong> | Pulse: <strong className="text-[#16343C]">{vis.vitals.pulseRate}</strong></p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[#708188]">OP No: <strong className="text-[#16343C]">{vis.opNumber}</strong></span>
                    <span className="text-[#0B6875] font-bold flex items-center">
                      View Summary <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </AppCard>
              ))}
            </div>
          </PageState>
        ) : (
          <PageState
            isLoading={isLabsLoading}
            isError={isLabsError}
            isEmpty={labs.length === 0}
            errorProps={{ onRetry: refetchLabs }}
            emptyProps={{
              title: 'No Lab Reports',
              description: 'Prescribed lab tests and diagnostic reports will be shown here.',
            }}
          >
            <div className="space-y-3.5">
              {labs.map((lab) => (
                <AppCard
                  key={lab.id}
                  variant="interactive"
                  onClick={() => nav.navigate(`/records/labs/${lab.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#E9A83A]/10 text-[#a06a10] flex items-center justify-center shrink-0">
                        <TestTube className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#16343C]">{lab.testName}</h2>
                        <p className="text-xs text-[#708188]">{lab.category} • Advised by {lab.advisedByDoctor}</p>
                      </div>
                    </div>
                    <StatusBadge
                      label={lab.status === 'reviewed' ? 'Report Ready' : lab.status}
                      variant={lab.status === 'reviewed' ? 'success' : 'warning'}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F7F9F8] text-xs">
                    <span className="text-[#708188]">Advised: {formatDate(lab.advisedDate)}</span>
                    <span className="text-[#0B6875] font-bold flex items-center">
                      View Report <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </AppCard>
              ))}
            </div>
          </PageState>
        )}
      </ScreenContainer>
    </div>
  );
};
