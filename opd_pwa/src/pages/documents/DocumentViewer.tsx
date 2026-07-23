import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '../../services/documentService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { PageState } from '../../components/ui/PageState';
import { useDocumentDownload } from '../../hooks/useDocumentDownload';
import { FileText, Download, ZoomIn, ZoomOut, ShieldAlert, Share2, Lock } from 'lucide-react';

export const DocumentViewer: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [zoom, setZoom] = useState<number>(100);
  const { isDownloading, downloadDocument } = useDocumentDownload();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentService.getDocumentById(documentId || 'doc-vis-301'),
  });

  const doc = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Secure Medical Document"
        rightAction={
          <button
            type="button"
            onClick={() => doc && downloadDocument(doc.url, `${doc.title}.pdf`)}
            className="p-2 text-[#0B6875] hover:bg-[#DFF3F5] rounded-full"
            aria-label="Download Document"
          >
            <Download className="w-5 h-5" />
          </button>
        }
      />

      <ScreenContainer hasBottomNav={false}>
        <PageState isLoading={isLoading} isError={isError} errorProps={{ onRetry: refetch }}>
          {doc && (
            <div className="space-y-3 pb-16">
              {/* Document Identity Banner */}
              <AppCard className="bg-[#16343C] text-white">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h1 className="font-bold text-sm text-white">{doc.title}</h1>
                    <p className="text-white/70 text-[11px] mt-0.5">Patient: {doc.patientName} (MR: {doc.mrNumber})</p>
                  </div>
                  <span className="bg-[#0B6875] text-[#DFF3F5] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    {doc.fileType}
                  </span>
                </div>
              </AppCard>

              {/* Security Banner */}
              <div className="bg-[#E9A83A]/10 border border-[#E9A83A]/30 rounded-[12px] p-2.5 text-[11px] text-[#a06a10] flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Protected Health Record. Non-transferable clinic authorization.</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center justify-between bg-white border border-[#DCE6E7] rounded-[12px] p-2 text-xs">
                <span className="text-[#708188] font-semibold">Zoom Level: {zoom}%</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(75, zoom - 25))}
                    className="p-1.5 bg-[#F7F9F8] rounded text-[#16343C] hover:bg-[#DCE6E7]"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(175, zoom + 25))}
                    className="p-1.5 bg-[#F7F9F8] rounded text-[#16343C] hover:bg-[#DCE6E7]"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Document Canvas Preview */}
              <div className="bg-white border border-[#DCE6E7] rounded-[18px] p-4 min-h-[420px] flex flex-col items-center justify-center text-center shadow-xs overflow-hidden">
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }} className="transition-transform duration-150 w-full">
                  <div className="w-full bg-[#F7F9F8] rounded-[14px] border border-dashed border-[#0B6875]/30 p-8 space-y-4">
                    <FileText className="w-16 h-16 text-[#0B6875] mx-auto opacity-80" />
                    <div>
                      <h2 className="text-base font-bold text-[#16343C]">BALAJI HEART CENTER</h2>
                      <p className="text-xs text-[#708188]">Official Digital Outpatient Record Document</p>
                    </div>
                    <div className="text-left text-xs bg-white p-4 rounded-[10px] border border-[#DCE6E7] space-y-1 font-mono">
                      <p>DOCUMENT_ID: {doc.id}</p>
                      <p>PATIENT: {doc.patientName}</p>
                      <p>MR_NO: {doc.mrNumber}</p>
                      <p>ISSUED_DATE: {doc.issueDate}</p>
                      <p>STATUS: VERIFIED_DIGITAL_RECORD</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2">
                <AppButton
                  size="full-width"
                  isLoading={isDownloading}
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => downloadDocument(doc.url, `${doc.title}.pdf`)}
                >
                  Download Medical Document PDF
                </AppButton>
              </div>
            </div>
          )}
        </PageState>
      </ScreenContainer>
    </div>
  );
};
