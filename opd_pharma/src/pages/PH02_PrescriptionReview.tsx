import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Stethoscope,
  Pill,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
  XCircle,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { PrescriptionRequest } from '../types/pharmacy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export const PH02_PrescriptionReview: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<PrescriptionRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verification Checklist
  const [checkPatientId, setCheckPatientId] = useState<boolean>(true);
  const [checkDosageSafety, setCheckDosageSafety] = useState<boolean>(true);
  const [checkAllergies, setCheckAllergies] = useState<boolean>(true);
  const [checkStockAvailable, setCheckStockAvailable] = useState<boolean>(true);

  // Substitute modal & Rejection modal
  const [substituteItem, setSubstituteItem] = useState<any | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    if (requestId) {
      pharmacyService
        .getRequestById(requestId)
        .then((data) => {
          setRequest(data);
        })
        .catch(() => {
          toast.error('Failed to load prescription request.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading Prescription Data for Review...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Prescription Request Not Found</h3>
        <Button variant="outline" onClick={() => navigate('/pharmacy')}>
          Back to Queue Dashboard
        </Button>
      </div>
    );
  }

  const allChecksPassed = checkPatientId && checkDosageSafety && checkAllergies && checkStockAvailable;

  const handleApproveAndStartPrep = async () => {
    if (!allChecksPassed) {
      toast.error('Please complete all pharmacist verification checklist items before approving.');
      return;
    }

    try {
      await pharmacyService.updateQueueStatus(request.id, 'preparing');
      toast.success(`Prescription approved! Moving Token #${request.token_number} to Medicine Preparation.`);
      navigate(`/pharmacy/requests/${request.id}/prepare`);
    } catch (err) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleRejectPrescription = async () => {
    if (!request) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify a clinical reason for rejecting or returning this prescription.');
      return;
    }
    try {
      await pharmacyService.updateQueueStatus(request.id, 'cancelled', {
        rejection_reason: rejectionReason,
      });
      toast.error(`Prescription Token #${request.token_number} rejected & returned to Dr. ${request.doctor.full_name}.`);
      setIsRejectModalOpen(false);
      navigate('/pharmacy');
    } catch (err) {
      toast.error('Failed to reject prescription.');
    }
  };

  const handleApplySubstitute = (sub: any, originalMedId: string) => {
    if (!request) return;
    const updatedMedicines = request.medicines.map((m) => {
      if (m.id === originalMedId) {
        return {
          ...m,
          medicine_name: sub.brand_name,
          generic_name: sub.generic_name,
          unit_price: sub.unit_price,
          available_qty: sub.available_qty,
          stock_status: 'in_stock' as const,
        };
      }
      return m;
    });

    const newTotal = updatedMedicines.reduce((sum, item) => sum + item.unit_price * item.prescribed_qty, 0);

    setRequest({
      ...request,
      medicines: updatedMedicines,
      total_amount: newTotal,
    });

    setSubstituteItem(null);
    toast.success(`Substituted ${sub.brand_name} for prescribed item.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Queue
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              PH-02 — Prescription Review & Safety Verification
            </h1>
            <p className="text-xs text-slate-500">Token #{request.token_number} | {request.patient.full_name}</p>
          </div>
        </div>
        <Badge variant={request.priority === 'stat' ? 'stat' : 'outline'} className="capitalize px-3 py-1 text-xs">
          Priority: {request.priority}
        </Badge>
      </div>

      {/* KNOWN ALLERGY SAFETY BANNER */}
      {request.patient.allergies && request.patient.allergies.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start space-x-3 shadow-xs">
          <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-950">HIGH ALLERGY RISK ALERT DETECTED</h3>
            {request.patient.allergies.map((a, idx) => (
              <p key={idx} className="text-xs text-rose-800 font-medium">
                Patient has reported allergy to <span className="font-bold underline">{a.allergen}</span> (Reaction: {a.reaction}, Severity: {a.severity}).
              </p>
            ))}
          </div>
        </div>
      )}

      {/* PATIENT & DOCTOR CLINICAL HEADER CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs border-slate-200 md:col-span-2">
          <CardHeader className="py-3 px-5 border-b bg-slate-50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600" /> Patient & Diagnosis Context
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
                <span className="font-bold text-slate-900 text-sm">{request.patient.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MR NUMBER</span>
                <span className="font-mono font-semibold text-slate-800">{request.patient.mr_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AGE / GENDER</span>
                <span className="font-semibold text-slate-800">{request.patient.age} Yrs / {request.patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">VITALS (BP / SPO2)</span>
                <span className="font-mono font-semibold text-teal-800">
                  {request.patient.vitals?.bp || '130/80'} | {request.patient.vitals?.sp02 || 98}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Doctor's Clinical Diagnosis</span>
              <p className="font-semibold text-slate-900 bg-teal-50/70 p-2.5 rounded-lg border border-teal-100 mt-1">
                {request.diagnosis}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* DOCTOR DETAILS */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="py-3 px-5 border-b bg-slate-50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Prescribing Physician
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs space-y-2">
            <div>
              <p className="font-bold text-slate-900 text-sm">{request.doctor.full_name}</p>
              <p className="text-teal-700 font-medium">{request.doctor.qualification}</p>
            </div>
            <p className="text-slate-500">Dept: <strong>{request.doctor.department}</strong></p>
            <p className="text-slate-500 font-mono text-[11px]">Reg: {request.doctor.registration_number}</p>
          </CardContent>
        </Card>
      </div>

      {/* PRESCRIBED MEDICINES EVALUATION TABLE */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Prescribed Medication Review</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Inspect stock availability, dosage, frequency, and select substitute if low stock.
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">ESTIMATED TOTAL</span>
            <span className="font-mono text-lg font-bold text-teal-700">{formatCurrency(request.total_amount)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine & Composition</TableHead>
                <TableHead>Dosage Rule</TableHead>
                <TableHead>Frequency / Duration</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Rack / Bin</TableHead>
                <TableHead>Prescribed Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.medicines.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">{m.medicine_name}</span>
                      <span className="text-[11px] text-slate-500">{m.generic_name || 'Generic Composition'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">{m.dosage}</TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span className="font-medium">{m.frequency}</span>
                    <span className="block text-[10px] text-slate-400">{m.duration}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.stock_status === 'in_stock' ? 'ready' : 'pending'}
                      className="capitalize text-[10px]"
                    >
                      {m.stock_status.replace('_', ' ')} ({m.available_qty} avail)
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{m.rack_location || 'Rack A-02'}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-sm">{m.prescribed_qty} units</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-800">
                    {formatCurrency(m.unit_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.substitute_options && m.substitute_options.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubstituteItem({ medId: m.id, options: m.substitute_options })}
                        className="text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                      >
                        Substitute
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VERIFICATION CHECKLIST & APPROVAL ACTION */}
      <Card className="shadow-md border-teal-200 bg-gradient-to-br from-slate-50 to-teal-50/20">
        <CardHeader className="py-3 px-6 border-b">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-teal-600" /> Pharmacist Mandated Verification Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer">
              <Checkbox checked={checkPatientId} onCheckedChange={(c) => setCheckPatientId(!!c)} />
              <span className="font-medium text-slate-800">1. Verified Patient Identity & MR Number matches prescription</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer">
              <Checkbox checked={checkDosageSafety} onCheckedChange={(c) => setCheckDosageSafety(!!c)} />
              <span className="font-medium text-slate-800">2. Confirmed dosage strength & frequency rules are safe</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer">
              <Checkbox checked={checkAllergies} onCheckedChange={(c) => setCheckAllergies(!!c)} />
              <span className="font-medium text-slate-800">3. Checked patient allergy history against prescribed generic names</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer">
              <Checkbox checked={checkStockAvailable} onCheckedChange={(c) => setCheckStockAvailable(!!c)} />
              <span className="font-medium text-slate-800">4. Verified stock availability & batch expiry status</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/pharmacy')} className="text-slate-600">
                Cancel Review
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                className="text-xs font-semibold"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject / Return to Doctor
              </Button>
            </div>
            <Button
              variant="medical"
              size="lg"
              disabled={!allChecksPassed}
              onClick={handleApproveAndStartPrep}
              className="px-8 shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Approve & Start Preparation (PH-03)
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* REJECTION / RETURN DIALOG */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-950 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Reject & Return Prescription to Prescriber
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              Token #{request.token_number} | {request.patient.full_name} ({request.doctor.full_name})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <label className="font-semibold text-slate-800 block">Rejection / Refusal Reason</label>
            <Input
              type="text"
              placeholder="e.g. Unsafe dosage contraindication, severe allergy conflict, or doctor clarification needed"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
              ⚠️ Rejecting will change status to Cancelled and notify Dr. {request.doctor.full_name} for order modification.
            </p>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRejectPrescription}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUBSTITUTE SELECTION DIALOG */}
      {substituteItem && (
        <Dialog open={!!substituteItem} onOpenChange={() => setSubstituteItem(null)}>
          <DialogContent className="sm:max-w-md bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Select Generic / Brand Substitute
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select an equivalent pharmaceutical substitute for low stock items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              {substituteItem.options.map((option: any) => (
                <div
                  key={option.id}
                  className="p-3 border rounded-xl bg-slate-50 hover:bg-teal-50 flex items-center justify-between cursor-pointer"
                  onClick={() => handleApplySubstitute(option, substituteItem.medId)}
                >
                  <div>
                    <p className="font-bold text-slate-900">{option.brand_name}</p>
                    <p className="text-[11px] text-slate-500">{option.generic_name}</p>
                    <span className="text-[10px] text-teal-700 font-semibold">{option.available_qty} units in stock</span>
                  </div>
                  <Button variant="medical" size="sm">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
