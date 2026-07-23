import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Volume2,
  MessageSquare,
  Printer,
  Search,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { PrescriptionRequest } from '../types/pharmacy';
import { usePharmacyStore } from '../store/usePharmacyStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export const PH04_ReadyPickup: React.FC = () => {
  const { searchQuery, setSearchQuery, openHandoverModal, openPrintModal } = usePharmacyStore();

  const [readyRequests, setReadyRequests] = useState<PrescriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReadyRequests = async () => {
    setIsLoading(true);
    try {
      const all = await pharmacyService.getQueueRequests();
      const readyOnly = all.filter((r) => r.status === 'ready');
      setReadyRequests(readyOnly);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReadyRequests();
  }, []);

  const handleAnnounceToken = (tokenNumber: number, patientName: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Token number ${tokenNumber}, ${patientName}, please proceed to Pharmacy Counter 2 for pickup.`
      );
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    toast.success(`Announcing Token #${tokenNumber} (${patientName}) on public address system.`);
  };

  const filtered = readyRequests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      r.patient.full_name.toLowerCase().includes(q) ||
      r.patient.mr_number.toLowerCase().includes(q) ||
      r.token_number.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            PH-04 — Ready for Pickup & Handover Station
          </h1>
          <p className="text-xs text-slate-500">
            Call tokens, verify patient identity, perform counseling, and complete dispensing.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReadyRequests} className="text-slate-700 bg-white">
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Ready List
        </Button>
      </div>

      {/* SEARCH BAR & SUMMARY BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search Token #, Patient Name or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{filtered.length} Token(s) Waiting at Counter</span>
        </div>
      </div>

      {/* READY PICKUP CARDS GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading ready list...</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Orders Waiting for Pickup</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All prepared prescriptions have been handed over to patients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((req) => (
            <Card
              key={req.id}
              className="shadow-sm border-2 border-emerald-200 hover:border-emerald-400 transition-all bg-gradient-to-b from-white to-emerald-50/10 flex flex-col justify-between"
            >
              <CardHeader className="py-4 px-5 border-b bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xl text-emerald-950 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                    TOKEN #{req.token_number}
                  </span>
                  <Badge variant="ready" className="text-[10px] font-bold">
                    READY FOR PICKUP
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-3">
                  {req.patient.full_name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-mono">
                  MRN: {req.patient.mr_number} | Age: {req.patient.age}Y ({req.patient.gender})
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-3 flex-1 text-xs">
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border">
                  <div className="flex justify-between text-slate-600">
                    <span>Prescription Items:</span>
                    <span className="font-bold text-slate-900">{req.medicines.length} Medicines</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Status:</span>
                    <span className="font-bold text-emerald-700 capitalize">{req.payment_status}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-t pt-1">
                    <span>Total Amount:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(req.total_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-teal-800 bg-teal-50 p-2 rounded border border-teal-100">
                  <MessageSquare className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>SMS/WhatsApp Pickup notification sent to {req.patient.phone}</span>
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50/80 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnnounceToken(req.token_number, req.patient.full_name)}
                  className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                  title="Announce Token on PA System"
                >
                  <Volume2 className="h-3.5 w-3.5 mr-1" />
                  Call Token
                </Button>

                <Button
                  variant="medical"
                  size="sm"
                  onClick={() => openHandoverModal(req)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Handover (PH-04)
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
