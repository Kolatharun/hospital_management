import React, { useState } from 'react';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { CheckCircle2, ShieldCheck, Printer, AlertCircle } from 'lucide-react';
import { pharmacyService } from '../../services/pharmacyService';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const HandoverModal: React.FC = () => {
  const { selectedRequestForHandover, closeHandoverModal, pharmacist, openPrintModal } = usePharmacyStore();
  const navigate = useNavigate();

  const [verifiedPatientId, setVerifiedPatientId] = useState(false);
  const [counselingGiven, setCounselingGiven] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedRequestForHandover) return null;
  const req = selectedRequestForHandover;

  const handleConfirmHandover = async () => {
    if (!verifiedPatientId || !counselingGiven) {
      toast.error('Please verify Patient ID and check Patient Counseling confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await pharmacyService.updateQueueStatus(req.id, 'completed', {
        dispensed_by: pharmacist.full_name,
        counseling_notes: 'Medication schedule, storage rules & dosage guidelines explained to patient.',
      });

      toast.success(`Handover complete for Token #${req.token_number} (${req.patient.full_name})!`);
      closeHandoverModal();
      navigate('/pharmacy/history');
    } catch (err) {
      toast.error('Failed to record handover. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!selectedRequestForHandover} onOpenChange={(open) => !open && closeHandoverModal()}>
      <DialogContent className="sm:max-w-md bg-white p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="ready" className="font-mono text-xs">
              Token #{req.token_number} Ready
            </Badge>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 font-bold border-emerald-200">
              Paid: {formatCurrency(req.total_amount)}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 mt-2">
            Confirm Handover & Dispensing
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            MRN: {req.patient.mr_number} | {req.patient.full_name} ({req.patient.age}Y/{req.patient.gender})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Summary Checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
            <h4 className="font-bold text-slate-800 border-b pb-1">Prescribed Medicines ({req.medicines.length})</h4>
            {req.medicines.map((m) => (
              <div key={m.id} className="flex justify-between items-center text-slate-700">
                <span>{m.medicine_name} ({m.dosage})</span>
                <span className="font-semibold text-slate-900">{m.prescribed_qty} units</span>
              </div>
            ))}
          </div>

          {/* Verification Protocol Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg border bg-emerald-50/50 border-emerald-100">
              <Checkbox
                checked={verifiedPatientId}
                onCheckedChange={(c) => setVerifiedPatientId(!!c)}
                className="mt-0.5"
              />
              <div>
                <span className="font-bold text-emerald-950">1. Verify Token & Patient Identity</span>
                <p className="text-[11px] text-emerald-800">Confirmed patient name: {req.patient.full_name} and phone: {req.patient.phone}</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg border bg-blue-50/50 border-blue-100">
              <Checkbox
                checked={counselingGiven}
                onCheckedChange={(c) => setCounselingGiven(!!c)}
                className="mt-0.5"
              />
              <div>
                <span className="font-bold text-blue-950">2. Mandatory Patient Counseling</span>
                <p className="text-[11px] text-blue-800">Explained timing, food restrictions, and special storage instructions.</p>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPrintModal(req)}
            className="text-slate-700 border-slate-300"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Receipt / Labels
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={closeHandoverModal}>
              Cancel
            </Button>
            <Button
              variant="medical"
              size="sm"
              disabled={!verifiedPatientId || !counselingGiven || isSubmitting}
              onClick={handleConfirmHandover}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isSubmitting ? 'Recording...' : 'Complete Dispense'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
