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
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  Search,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { PrescriptionRequest, MedicineItem, DrugStockItem, StockStatus } from '../types/pharmacy';
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
  const [stockInventory, setStockInventory] = useState<DrugStockItem[]>([]);

  // Verification Checklist
  const [checkPatientId, setCheckPatientId] = useState<boolean>(true);
  const [checkDosageSafety, setCheckDosageSafety] = useState<boolean>(true);
  const [checkAllergies, setCheckAllergies] = useState<boolean>(true);
  const [checkStockAvailable, setCheckStockAvailable] = useState<boolean>(true);

  // Edit Quantity Modal State
  const [editingMed, setEditingMed] = useState<MedicineItem | null>(null);
  const [editQtyValue, setEditQtyValue] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('Patient requested reduced quantity');

  // Substitute modal & Rejection modal
  const [substituteItem, setSubstituteItem] = useState<{ med: MedicineItem; options: any[] } | null>(null);
  const [substituteSearch, setSubstituteSearch] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    if (requestId) {
      Promise.all([
        pharmacyService.getRequestById(requestId),
        pharmacyService.getStockInventory(),
      ])
        .then(([reqData, stockData]) => {
          // Initialize original_qty if not already present
          const medicinesWithOriginal = reqData.medicines.map((m) => ({
            ...m,
            original_qty: m.original_qty ?? m.prescribed_qty,
          }));
          setRequest({ ...reqData, medicines: medicinesWithOriginal });
          setStockInventory(stockData);
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

  // Direct Quantity Change Handler
  const handleQuantityChange = (medId: string, newQty: number, reason?: string) => {
    if (!request) return;

    const clampedQty = Math.max(0, newQty);
    const updatedMedicines = request.medicines.map((m) => {
      if (m.id === medId) {
        if (clampedQty > m.available_qty) {
          toast.warning(`Quantity exceeds available stock (${m.available_qty} available).`);
        }
        return {
          ...m,
          prescribed_qty: clampedQty,
          adjustment_reason: reason || m.adjustment_reason || (clampedQty !== (m.original_qty ?? m.prescribed_qty) ? 'Quantity adjusted by pharmacist' : undefined),
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
  };

  // Reset Item to Doctor's Original Quantity
  const handleResetItem = (medId: string) => {
    if (!request) return;
    const updatedMedicines = request.medicines.map((m) => {
      if (m.id === medId) {
        const origQty = m.original_qty ?? m.prescribed_qty;
        return {
          ...m,
          prescribed_qty: origQty,
          adjustment_reason: undefined,
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
    toast.info('Reset to doctor\'s original prescribed quantity.');
  };

  // Remove / Exclude Item
  const handleRemoveItem = (medId: string) => {
    handleQuantityChange(medId, 0, 'Item excluded at patient request');
    toast.info('Item quantity set to 0 (Excluded from dispensing).');
  };

  // Open Edit Quantity Modal Module
  const handleOpenEditModal = (med: MedicineItem) => {
    setEditingMed(med);
    setEditQtyValue(med.prescribed_qty);
    setEditReason(med.adjustment_reason || 'Patient requested partial supply / reduced quantity');
  };

  // Save Edit Quantity Modal Changes
  const handleSaveEditModal = () => {
    if (!editingMed) return;
    handleQuantityChange(editingMed.id, editQtyValue, editReason);
    setEditingMed(null);
    toast.success(`Updated quantity for ${editingMed.medicine_name} to ${editQtyValue} units.`);
  };

  // Open Substitute Modal Module
  const handleOpenSubstituteModal = (med: MedicineItem) => {
    // Combine pre-configured substitute options with available stock items
    let options = med.substitute_options || [];
    if (options.length === 0) {
      // Find matching items from stock inventory with similar generic name or category
      options = stockInventory
        .filter((s) => s.total_stock > 0 && s.brand_name !== med.medicine_name)
        .map((s) => ({
          id: s.id,
          brand_name: s.brand_name,
          generic_name: s.generic_name,
          available_qty: s.total_stock,
          unit_price: s.unit_price,
        }));
    }
    setSubstituteItem({ med, options });
    setSubstituteSearch('');
  };

  // Apply Substitute
  const handleApplySubstitute = (sub: any, originalMedId: string) => {
    if (!request) return;
    const updatedMedicines: MedicineItem[] = request.medicines.map((m) => {
      if (m.id === originalMedId) {
        return {
          ...m,
          medicine_name: sub.brand_name,
          generic_name: sub.generic_name,
          unit_price: sub.unit_price,
          available_qty: sub.available_qty,
          stock_status: (sub.available_qty > 0 ? 'in_stock' : 'out_of_stock') as StockStatus,
          adjustment_reason: `Substituted with ${sub.brand_name}`,
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

  // Approve & Move to Stage PH-03 (Medicine Preparation)
  const handleApproveAndStartPrep = async () => {
    if (!allChecksPassed) {
      toast.error('Please complete all pharmacist verification checklist items before approving.');
      return;
    }

    try {
      await pharmacyService.updateQueueStatus(request.id, 'preparing', {
        medicines: request.medicines,
        total_amount: request.total_amount,
      });
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
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-600" /> Prescribed Medication Review
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Directly edit quantity if patient requires partial fulfillment, or use Action buttons to edit/substitute/exclude.
            </CardDescription>
          </div>
          <div className="text-right bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
            <span className="text-[10px] text-teal-800 font-bold block uppercase tracking-wider">ESTIMATED TOTAL</span>
            <span className="font-mono text-xl font-extrabold text-teal-700">{formatCurrency(request.total_amount)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="py-3">Medicine & Composition</TableHead>
                <TableHead>Dosage Rule</TableHead>
                <TableHead>Frequency / Duration</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Rack / Bin</TableHead>
                <TableHead className="w-[170px]">Prescribed Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right w-[200px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.medicines.map((m) => {
                const isQtyModified = m.original_qty !== undefined && m.original_qty !== m.prescribed_qty;

                return (
                  <TableRow key={m.id} className={`hover:bg-slate-50 transition-colors ${m.prescribed_qty === 0 ? 'bg-slate-100/60 opacity-60' : ''}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {m.medicine_name}
                          {isQtyModified && (
                            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 font-medium py-0 px-1">
                              Qty Adjusted
                            </Badge>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500">{m.generic_name || 'Generic Composition'}</span>
                        {m.adjustment_reason && (
                          <span className="text-[10px] text-teal-700 font-medium italic mt-0.5">
                            Note: {m.adjustment_reason}
                          </span>
                        )}
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
                    
                    {/* DIRECTLY EDITABLE PRESCRIBED QTY COLUMN */}
                    <TableCell className="w-[170px]">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-slate-900 border-slate-300 shrink-0"
                            onClick={() => handleQuantityChange(m.id, Math.max(0, m.prescribed_qty - 1))}
                            disabled={m.prescribed_qty <= 0}
                            title="Decrease Quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            max={m.available_qty}
                            value={m.prescribed_qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleQuantityChange(m.id, isNaN(val) ? 0 : val);
                            }}
                            className="h-7 w-16 text-center font-extrabold text-slate-900 text-xs px-1 border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-slate-900 border-slate-300 shrink-0"
                            onClick={() => handleQuantityChange(m.id, Math.min(m.available_qty, m.prescribed_qty + 1))}
                            disabled={m.prescribed_qty >= m.available_qty}
                            title="Increase Quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {isQtyModified && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Doc prescribed: <strong className="line-through">{m.original_qty}</strong> units
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-slate-800">
                      {formatCurrency(m.unit_price)}
                    </TableCell>

                    {/* ACTION COLUMN WITH MODULE LAUNCHERS & CONTROLS */}
                    <TableCell className="text-right w-[200px]">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Module Button: Edit Qty & Presets Modal */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(m)}
                          className="text-xs h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-medium"
                          title="Open Module to Edit Quantity and Duration"
                        >
                          <Edit3 className="h-3 w-3 text-teal-600" />
                          <span>Edit</span>
                        </Button>

                        {/* Module Button: Substitute Selector */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSubstituteModal(m)}
                          className="text-xs h-7 px-2 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 font-medium"
                          title="Substitute with available stock drug"
                        >
                          <RefreshCw className="h-3 w-3 text-amber-600" />
                          <span>Sub</span>
                        </Button>

                        {/* Reset Button (If modified) */}
                        {isQtyModified && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetItem(m.id)}
                            className="h-7 w-7 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Reset to doctor's original quantity"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Remove / Exclude Item Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(m.id)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Exclude item (Patient declined)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-teal-300">
              <Checkbox checked={checkPatientId} onCheckedChange={(c) => setCheckPatientId(!!c)} />
              <span className="font-medium text-slate-800">1. Verified Patient Identity & MR Number matches prescription</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-teal-300">
              <Checkbox checked={checkDosageSafety} onCheckedChange={(c) => setCheckDosageSafety(!!c)} />
              <span className="font-medium text-slate-800">2. Confirmed dosage strength & frequency rules are safe</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-teal-300">
              <Checkbox checked={checkAllergies} onCheckedChange={(c) => setCheckAllergies(!!c)} />
              <span className="font-medium text-slate-800">3. Checked patient allergy history against prescribed generic names</span>
            </label>

            <label className="flex items-center space-x-3 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-teal-300">
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

      {/* MODAL MODULE 1: EDIT QUANTITY & SUPPLY DETAILS */}
      {editingMed && (
        <Dialog open={!!editingMed} onOpenChange={() => setEditingMed(null)}>
          <DialogContent className="sm:max-w-md bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-teal-600" /> Edit Prescribed Quantity Module
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Adjust dispensing quantity for patient request, partial supply, or stock limits.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Medicine Summary Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{editingMed.medicine_name}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {editingMed.available_qty} Available
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">{editingMed.generic_name}</p>
                <p className="text-[11px] text-slate-700">
                  Dosage Rule: <strong>{editingMed.dosage}</strong> | Freq: <strong>{editingMed.frequency}</strong> ({editingMed.duration})
                </p>
                <p className="text-[11px] text-teal-800 font-semibold pt-1">
                  Doctor's Prescribed Quantity: <span className="font-mono font-bold">{editingMed.original_qty ?? editingMed.prescribed_qty} units</span>
                </p>
              </div>

              {/* Quantity Stepper & Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">New Dispensing Quantity (Units)</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditQtyValue(Math.max(0, editQtyValue - 1))}
                    disabled={editQtyValue <= 0}
                    className="h-9 w-9 text-slate-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    max={editingMed.available_qty}
                    value={editQtyValue}
                    onChange={(e) => setEditQtyValue(parseInt(e.target.value, 10) || 0)}
                    className="text-center text-lg font-bold text-slate-900 h-10 w-28 font-mono border-slate-300"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditQtyValue(Math.min(editingMed.available_qty, editQtyValue + 1))}
                    disabled={editQtyValue >= editingMed.available_qty}
                    className="h-9 w-9 text-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Supply Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-medium block">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditQtyValue(editingMed.original_qty ?? editingMed.prescribed_qty)}
                    className="text-xs border-teal-200 text-teal-800 hover:bg-teal-50"
                  >
                    100% Full Supply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditQtyValue(Math.ceil((editingMed.original_qty ?? editingMed.prescribed_qty) / 2))}
                    className="text-xs border-amber-200 text-amber-800 hover:bg-amber-50"
                  >
                    50% Half Supply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditQtyValue(Math.min(30, editingMed.original_qty ?? editingMed.prescribed_qty))}
                    className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    30-Day Max
                  </Button>
                </div>
              </div>

              {/* Reason for Quantity Adjustment */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">Reason for Adjustment</label>
                <Input
                  type="text"
                  placeholder="e.g. Patient requested fewer days due to cost/preference"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="text-xs border-slate-300"
                />
              </div>

              {/* Recalculated Item Cost */}
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-100 flex items-center justify-between">
                <span className="text-teal-900 font-medium">New Subtotal Price:</span>
                <span className="font-mono text-base font-extrabold text-teal-800">
                  {formatCurrency(editQtyValue * editingMed.unit_price)}
                </span>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setEditingMed(null)}>
                Cancel
              </Button>
              <Button variant="medical" size="sm" onClick={handleSaveEditModal}>
                Apply & Update Total
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL MODULE 2: SUBSTITUTE SELECTION */}
      {substituteItem && (
        <Dialog open={!!substituteItem} onOpenChange={() => setSubstituteItem(null)}>
          <DialogContent className="sm:max-w-lg bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                Select Generic / Brand Substitute Module
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select an equivalent pharmaceutical substitute for low stock items or patient preference.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              {/* Search Filter */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search substitute drugs in inventory..."
                  value={substituteSearch}
                  onChange={(e) => setSubstituteSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Substitute Options List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {substituteItem.options
                  .filter((opt: any) =>
                    !substituteSearch ||
                    opt.brand_name.toLowerCase().includes(substituteSearch.toLowerCase()) ||
                    opt.generic_name?.toLowerCase().includes(substituteSearch.toLowerCase())
                  )
                  .map((option: any) => (
                    <div
                      key={option.id}
                      className="p-3 border rounded-xl bg-slate-50 hover:bg-teal-50/70 transition-colors flex items-center justify-between cursor-pointer border-slate-200 hover:border-teal-300"
                      onClick={() => handleApplySubstitute(option, substituteItem.med.id)}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm">{option.brand_name}</p>
                        <p className="text-[11px] text-slate-500">{option.generic_name || 'Generic'}</p>
                        <div className="flex items-center space-x-2 text-[10px] pt-1">
                          <span className="text-teal-700 font-semibold bg-teal-100/60 px-1.5 py-0.5 rounded">
                            {option.available_qty} units available
                          </span>
                          <span className="font-mono text-slate-700">
                            {formatCurrency(option.unit_price)} / unit
                          </span>
                        </div>
                      </div>
                      <Button variant="medical" size="sm" className="text-xs">
                        Select Substitute
                      </Button>
                    </div>
                  ))}

                {substituteItem.options.length === 0 && (
                  <p className="text-center text-slate-500 py-6">No alternative substitutes available in current stock.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
    </div>
  );
};
