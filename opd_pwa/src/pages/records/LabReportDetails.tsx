import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { recordService } from '../../services/recordService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageState } from '../../components/ui/PageState';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { TestTube, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const LabReportDetails: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const nav = useAppNavigation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['labReport', reportId],
    queryFn: () => recordService.getLabReportById(reportId || 'lab-101'),
  });

  const report = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Lab Report Details" />

      <ScreenContainer hasBottomNav={true}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {report && (
            <div className="space-y-4">
              <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-[16px] bg-[#E9A83A]/10 text-[#a06a10] flex items-center justify-center shrink-0">
                      <TestTube className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-[#16343C]">{report.testName}</h1>
                      <p className="text-xs text-[#708188]">{report.category}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={report.status === 'reviewed' ? 'Reviewed' : report.status}
                    variant={report.status === 'reviewed' ? 'success' : 'warning'}
                  />
                </div>
              </AppCard>

              {report.testPreparationNotes && (
                <AppCard>
                  <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-[#E9A83A]" /> Test Instructions & Preparation
                  </h2>
                  <p className="text-xs text-[#708188]">{report.testPreparationNotes}</p>
                </AppCard>
              )}

              {report.reviewedByDoctorNotes && (
                <AppCard className="bg-[#23866A]/10 border-[#23866A]/30">
                  <h2 className="text-xs font-bold text-[#23866A] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Doctor Review Notes
                  </h2>
                  <p className="text-xs text-[#16343C] font-medium">{report.reviewedByDoctorNotes}</p>
                </AppCard>
              )}

              {report.documentId && (
                <div className="pt-2">
                  <AppButton
                    size="full-width"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => nav.goToDocument(report.documentId!)}
                  >
                    View Official Lab Document (PDF)
                  </AppButton>
                </div>
              )}
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
