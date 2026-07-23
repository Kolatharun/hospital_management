import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Barcode,
  Layers,
  MapPin,
  Tag,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { PrescriptionRequest } from '../types/pharmacy';
import { usePharmacyStore } from '../store/usePharmacyStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export const PH03_MedicinePreparation: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { openPrintModal } = usePharmacyStore();

  const [request, setRequest] = useState<PrescriptionRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (requestId) {
      pharmacyService
        .getRequestById(requestId)
        .then((data) => {
          setRequest(data);
          // Pre-populate picked state
          const initialPicked: Record<string, boolean> = {};
          const initialLabels: Record<string, string> = {};
          data.medicines.forEach((m) => {
            initialPicked[m.id] = true;
            initialLabels[m.id] = 'Take after food with water';
          });
          setPickedItems(initialPicked);
          setSelectedLabels(initialLabels);
        })
        .catch(() => {
          toast.error('Failed to load preparation data.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading Medicine Pick List...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-xl border">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Preparation Request Not Found</h3>
        <Button variant="outline" onClick={() => navigate('/pharmacy')}>
          Back to Queue
        </Button>
      </div>
    );
  }

  const allItemsPicked =
    request.medicines.length > 0 &&
    request.medicines.every((m) => pickedItems[m.id] === true);

  const handleTogglePicked = (medId: string) => {
    setPickedItems((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleSelectAll = () => {
    if (!request) return;
    const all: Record<string, boolean> = {};
    request.medicines.forEach((m) => {
      all[m.id] = true;
    });
    setPickedItems(all);
    toast.success('All prescribed items marked as picked.');
  };

  const handleClearAll = () => {
    setPickedItems({});
  };

  const handleMarkReady = async () => {
    if (!allItemsPicked) {
      toast.error('Please verify and pick all prescribed items before marking ready.');
      return;
    }

    try {
      await pharmacyService.updateQueueStatus(request.id, 'ready');
      toast.success(`Token #${request.token_number} (${request.patient.full_name}) is Ready for Pickup!`);
      navigate('/pharmacy/ready');
    } catch (err) {
      toast.error('Failed to mark request ready.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Queue
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              PH-03 — Medicine Preparation & Packaging Station
            </h1>
            <p className="text-xs text-slate-500">Token #{request.token_number} | {request.patient.full_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPrintModal(request)}
            className="text-slate-700 bg-white"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Barcode Labels
          </Button>
          <Badge variant="preparing" className="capitalize px-3 py-1 text-xs">
            Status: In Preparation
          </Badge>
        </div>
      </div>

      {/* DISPENSING WORKSTATION PICK LIST HEADER */}
      <Card className="shadow-xs border-slate-200 bg-slate-900 text-white">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500 text-slate-950 font-mono font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
              #{request.token_number}
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase block">
                DISPENSING PICK LIST
              </span>
              <h2 className="text-lg font-bold text-slate-100">{request.patient.full_name}</h2>
              <p className="text-xs text-slate-400 font-mono">
                MRN: {request.patient.mr_number} | Doctor: {request.doctor.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">PICKING PROGRESS</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {Object.values(pickedItems).filter(Boolean).length} / {request.medicines.length} Items Picked
              </span>
            </div>
            <PackageCheck className="h-6 w-6 text-emerald-400" />
          </div>
        </CardContent>
      </Card>

      {/* ITEM PICKING LIST & RACK LOCATIONS */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Prescribed Medicine Pick List</CardTitle>
            <CardDescription className="text-xs text-slate-500">Check items as you physically pick them from shelf</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs text-teal-800 border-teal-200">
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-slate-500">
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {request.medicines.map((m, idx) => {
            const isPicked = pickedItems[m.id] || false;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isPicked
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Checkbox & Drug Info */}
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={isPicked}
                      onCheckedChange={() => handleTogglePicked(m.id)}
                      className="mt-1 h-5 w-5 border-2"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-base">{m.medicine_name}</span>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-100">
                          {m.dosage}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Generic: {m.generic_name || 'Generic Formulation'} | Schedule: {m.frequency} for {m.duration}
                      </p>
                      <p className="text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded inline-block">
                        Instructions: {m.instructions}
                      </p>
                    </div>
                  </div>

                  {/* Rack Location & Batch Selection */}
                  <div className="flex items-center space-x-6 text-xs shrink-0 bg-slate-50 p-3 rounded-lg border">
                    <div className="flex items-center space-x-1.5 font-mono text-slate-700">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">SHELF LOCATION</span>
                        <span className="font-bold text-slate-900">{m.rack_location || 'Rack A-02'}</span>
                      </div>
                    </div>

                    <div className="border-l pl-4 font-mono">
                      <span className="text-[10px] text-slate-400 block">BATCH NUMBER</span>
                      <span className="font-bold text-slate-900">{m.batch_number || 'TEL-2026-B9'}</span>
                      <span className="text-[10px] text-slate-500 block">Exp: {m.expiry_date || '2027-11-30'}</span>
                    </div>

                    <div className="border-l pl-4 font-mono text-center">
                      <span className="text-[10px] text-slate-400 block">REQUIRED QTY</span>
                      <span className="font-extrabold text-slate-900 text-sm">{m.prescribed_qty} units</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* FINAL PREPARATION PACKAGING ACTIONS */}
      <Card className="shadow-md border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Preparation Complete?</h4>
            <p className="text-xs text-slate-500">
              All items picked, double-checked, and packaged into patient medication bag.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/pharmacy')} className="text-slate-600">
              Back to Queue
            </Button>
            <Button
              variant="medical"
              size="lg"
              disabled={!allItemsPicked}
              onClick={handleMarkReady}
              className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Mark Ready for Pickup (PH-04)
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
