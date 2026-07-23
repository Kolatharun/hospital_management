import React from 'react';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Pill, QrCode } from 'lucide-react';

export const PrintLabelModal: React.FC = () => {
  const { selectedRequestForPrint, closePrintModal, pharmacist } = usePharmacyStore();

  if (!selectedRequestForPrint) return null;
  const req = selectedRequestForPrint;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={!!selectedRequestForPrint} onOpenChange={(open) => !open && closePrintModal()}>
      <DialogContent className="sm:max-w-lg bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Printer className="h-5 w-5 text-teal-600" /> Print Medication Labels
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            Token #{req.token_number} | {req.patient.full_name} ({req.patient.mr_number})
          </DialogDescription>
        </DialogHeader>

        {/* Printable Label View */}
        <div className="print-area space-y-4 py-3">
          {req.medicines.map((m, idx) => (
            <div
              key={idx}
              className="p-4 border-2 border-slate-800 rounded-xl bg-slate-50 space-y-2 text-slate-900 shadow-sm"
            >
              {/* Hospital Header */}
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    BHC
                  </div>
                  <span className="font-bold text-xs tracking-tight">BALAJI HEART CENTER OPD PHARMACY</span>
                </div>
                <span className="font-mono font-bold text-xs bg-slate-200 px-2 py-0.5 rounded">
                  TOKEN #{req.token_number}
                </span>
              </div>

              {/* Patient Info */}
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Pt: {req.patient.full_name} ({req.patient.age}Y/{req.patient.gender[0]})</span>
                <span>MRN: {req.patient.mr_number}</span>
              </div>

              {/* Drug Details */}
              <div className="bg-white p-2.5 rounded border border-slate-300 text-xs space-y-1">
                <p className="font-bold text-slate-950 text-sm">{m.medicine_name}</p>
                <div className="flex justify-between font-mono text-[11px] text-teal-900">
                  <span>Dose: {m.dosage}</span>
                  <span>Freq: {m.frequency}</span>
                  <span>Days: {m.duration}</span>
                </div>
                <p className="text-[11px] font-medium text-slate-700 bg-teal-50/70 p-1.5 rounded border border-teal-100">
                  ⚠️ Instructions: {m.instructions}
                </p>
              </div>

              {/* Barcode & Dispenser Info */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                <div>
                  <p>Batch: {m.batch_number || 'BATCH-2026-X'}</p>
                  <p>Dispensed by: {pharmacist.full_name.split(' ')[0]}</p>
                </div>
                <div className="flex items-center space-x-1 border px-2 py-1 rounded bg-white font-mono text-[9px]">
                  <QrCode className="h-6 w-6 text-slate-800" />
                  <span>{req.patient.mr_number}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" size="sm" onClick={closePrintModal}>
            Close
          </Button>
          <Button variant="medical" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print All Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
