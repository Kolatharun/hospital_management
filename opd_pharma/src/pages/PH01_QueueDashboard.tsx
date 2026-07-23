import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  Pill,
} from 'lucide-react';
import { usePharmacyStore } from '../store/usePharmacyStore';
import { pharmacyService } from '../services/pharmacyService';
import { PrescriptionRequest, QueueMetrics } from '../types/pharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const PH01_QueueDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, openPrescriptionDrawer, openHandoverModal } = usePharmacyStore();

  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await pharmacyService.getQueueRequests();
      const m = await pharmacyService.getMetrics();
      setRequests(data);
      setMetrics(m);
    } catch (err) {
      console.error('Error loading pharmacy queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter requests by Tab & Global Search Query
  const filteredRequests = requests.filter((req) => {
    const matchesTab =
      activeTab === 'all'
        ? req.status !== 'completed'
        : activeTab === 'pending'
        ? req.status === 'pending' || req.status === 'reviewing'
        : activeTab === 'preparing'
        ? req.status === 'preparing'
        : activeTab === 'ready'
        ? req.status === 'ready'
        : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      req.patient.full_name.toLowerCase().includes(query) ||
      req.patient.mr_number.toLowerCase().includes(query) ||
      req.patient.op_number.toLowerCase().includes(query) ||
      req.token_number.toString().includes(query) ||
      req.doctor.full_name.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboardIcon className="h-6 w-6 text-teal-600" />
            PH-01 — Pharmacy Queue Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time prescription review, preparation tracking & dispensing station queue.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData} className="text-slate-700 bg-white">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
          <Button variant="medical" size="sm" onClick={() => navigate('/pharmacy/stock')}>
            <Pill className="h-4 w-4 mr-1.5" />
            Check Stock (PH-05)
          </Button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-900 flex justify-between items-center">
              Pending Review
              <Clock className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-950 font-mono">
              {metrics ? metrics.pending_count : <Skeleton className="h-7 w-12" />}
            </div>
            <p className="text-[10px] text-amber-700 mt-1">Needs verification (PH-02)</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-900 flex justify-between items-center">
              In Preparation
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-950 font-mono">
              {metrics ? metrics.preparing_count : <Skeleton className="h-7 w-12" />}
            </div>
            <p className="text-[10px] text-blue-700 mt-1">Being picked & packed (PH-03)</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-900 flex justify-between items-center">
              Ready for Pickup
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-950 font-mono">
              {metrics ? metrics.ready_count : <Skeleton className="h-7 w-12" />}
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">Ready for patient handover (PH-04)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700 flex justify-between items-center">
              Dispensed Today
              <UserCheck className="h-4 w-4 text-slate-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {metrics ? metrics.dispensed_today : <Skeleton className="h-7 w-12" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-teal-900 flex justify-between items-center">
              Avg Turnaround Time
              <Zap className="h-4 w-4 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-teal-950 font-mono">
              {metrics ? `${metrics.avg_wait_minutes}m` : <Skeleton className="h-7 w-12" />}
            </div>
            <p className="text-[10px] text-teal-700 mt-1">Target: &lt; 10 mins</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER TABS & QUEUE TABLE */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-3 px-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all" className="text-xs font-medium px-4">
                Active Queue ({requests.filter((r) => r.status !== 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs font-medium px-4">
                Pending ({requests.filter((r) => r.status === 'pending' || r.status === 'reviewing').length})
              </TabsTrigger>
              <TabsTrigger value="preparing" className="text-xs font-medium px-4">
                Preparing ({requests.filter((r) => r.status === 'preparing').length})
              </TabsTrigger>
              <TabsTrigger value="ready" className="text-xs font-medium px-4">
                Ready ({requests.filter((r) => r.status === 'ready').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-normal text-slate-500 bg-slate-50">
              Showing {filteredRequests.length} of {requests.length} requests
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">Queue is Clear!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active pharmacy requests matching your filter criteria right now.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Token #</TableHead>
                  <TableHead>Patient Info</TableHead>
                  <TableHead>Doctor & Dept</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Elapsed Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action Workflows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => {
                  const elapsedStr = formatDistanceToNow(new Date(req.created_at), { addSuffix: true });

                  return (
                    <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-sm text-slate-900">
                        #{req.token_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {req.patient.full_name}
                            {req.patient.allergies && req.patient.allergies.length > 0 && (
                              <span title="Known Allergy Alert" className="text-red-500 font-bold text-xs bg-red-100 px-1 rounded">
                                ⚠️ Allergy
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            MRN: {req.patient.mr_number} | {req.patient.age}Y/{req.patient.gender[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-slate-800">{req.doctor.full_name}</span>
                          <span className="text-[10px] text-slate-500">{req.doctor.department}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={req.priority === 'stat' ? 'stat' : req.priority === 'urgent' ? 'urgent' : 'outline'}
                          className="capitalize text-[10px] px-2"
                        >
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {req.medicines.length} Medicines
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {formatCurrency(req.total_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {elapsedStr}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === 'pending'
                              ? 'pending'
                              : req.status === 'preparing'
                              ? 'preparing'
                              : req.status === 'ready'
                              ? 'ready'
                              : 'completed'
                          }
                          className="capitalize text-[11px] px-2.5 py-0.5"
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Inspect Details"
                            onClick={() => openPrescriptionDrawer(req)}
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </Button>

                          {(req.status === 'pending' || req.status === 'reviewing') && (
                            <Button
                              variant="medical"
                              size="sm"
                              onClick={() => navigate(`/pharmacy/requests/${req.id}/review`)}
                              className="text-xs"
                            >
                              Review (PH-02)
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          )}

                          {req.status === 'preparing' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate(`/pharmacy/requests/${req.id}/prepare`)}
                              className="text-xs bg-blue-700 hover:bg-blue-800"
                            >
                              Prep (PH-03)
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          )}

                          {req.status === 'ready' && (
                            <Button
                              variant="medical"
                              size="sm"
                              onClick={() => openHandoverModal(req)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Handover (PH-04)
                              <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const LayoutDashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
