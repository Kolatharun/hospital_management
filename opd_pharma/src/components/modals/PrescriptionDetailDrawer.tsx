import React from 'react';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { AlertTriangle, FileText, User, Stethoscope, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const PrescriptionDetailDrawer: React.FC = () => {
  const { selectedRequestForDrawer, closePrescriptionDrawer } = usePharmacyStore();
  const navigate = useNavigate();

  if (!selectedRequestForDrawer) return null;

  const req = selectedRequestForDrawer;

  const handleStartReview = () => {
    closePrescriptionDrawer();
    navigate(`/pharmacy/requests/${req.id}/review`);
  };

  const handleStartPrep = () => {
    closePrescriptionDrawer();
    navigate(`/pharmacy/requests/${req.id}/prepare`);
  };

  return (
    <Sheet open={!!selectedRequestForDrawer} onOpenChange={(open) => !open && closePrescriptionDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-white p-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-xs bg-slate-100 text-slate-700">
              Token #{req.token_number}
            </Badge>
            <Badge
              variant={
                req.status === 'pending'
                  ? 'pending'
                  : req.status === 'preparing'
                  ? 'preparing'
                  : req.status === 'ready'
                  ? 'ready'
                  : 'secondary'
              }
              className="capitalize text-xs px-2.5 py-0.5"
            >
              {req.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-slate-900 mt-2">
            Prescription Review — {req.patient.full_name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500 font-mono">
            MRN: {req.patient.mr_number} | OP: {req.patient.op_number}
          </SheetDescription>
        </SheetHeader>

        {/* Patient Vitals & Allergy Alert Header */}
        <div className="py-4 space-y-4">
          {req.patient.allergies && req.patient.allergies.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-900">KNOWN PATIENT ALLERGIES</h4>
                {req.patient.allergies.map((a, idx) => (
                  <p key={idx} className="text-xs text-red-700">
                    <span className="font-semibold">{a.allergen}</span>: {a.reaction} ({a.severity})
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Patient Profile Card */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">PATIENT DETAILS</span>
              <p className="font-bold text-slate-800">{req.patient.full_name}</p>
              <p className="text-slate-600">{req.patient.age} Yrs / {req.patient.gender} ({req.patient.blood_group || 'O+'})</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PRESCRIBING DOCTOR</span>
              <p className="font-bold text-slate-800">{req.doctor.full_name}</p>
              <p className="text-slate-600">{req.doctor.department} ({req.doctor.qualification})</p>
            </div>
          </div>

          {/* Diagnosis & Notes */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-teal-600" /> Diagnosis & Clinical Advice
            </h4>
            <p className="text-xs bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 text-slate-800 font-medium">
              {req.diagnosis}
            </p>
            {req.clinical_notes && (
              <p className="text-xs text-slate-500 italic px-1">"{req.clinical_notes}"</p>
            )}
          </div>

          <Separator />

          {/* Prescribed Medicines List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>PRESCRIBED MEDICINES ({req.medicines.length})</span>
              <span className="text-teal-700 font-mono text-sm">{formatCurrency(req.total_amount)}</span>
            </h4>

            <div className="space-y-2">
              {req.medicines.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{m.medicine_name}</span>
                    <Badge variant={m.stock_status === 'in_stock' ? 'ready' : 'pending'} className="text-[10px]">
                      {m.stock_status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <span>Dosage: <strong>{m.dosage}</strong></span>
                    <span>Freq: <strong>{m.frequency}</strong></span>
                    <span>Duration: <strong>{m.duration}</strong></span>
                  </div>
                  <p className="text-[11px] text-teal-800 font-medium pt-1">
                    Instructions: {m.instructions}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-1 mt-1">
                    <span>Rack: {m.rack_location || 'Rack A-01'}</span>
                    <span>Qty: {m.prescribed_qty} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t flex items-center space-x-3">
          {req.status === 'pending' && (
            <Button variant="medical" className="w-full" onClick={handleStartReview}>
              Open Full Review (PH-02)
            </Button>
          )}
          {req.status === 'preparing' && (
            <Button variant="medical" className="w-full" onClick={handleStartPrep}>
              Go to Prep Station (PH-03)
            </Button>
          )}
          {req.status === 'ready' && (
            <Button variant="medical" className="w-full" onClick={() => {
              closePrescriptionDrawer();
              usePharmacyStore.getState().openHandoverModal(req);
            }}>
              Proceed to Handover (PH-04)
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
