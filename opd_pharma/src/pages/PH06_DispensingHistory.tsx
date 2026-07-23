import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  FileText,
  UserCheck,
  Calendar,
  Eye,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { DispenseLog } from '../types/pharmacy';
import { usePharmacyStore } from '../store/usePharmacyStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const PH06_DispensingHistory: React.FC = () => {
  const { searchQuery, setSearchQuery } = usePharmacyStore();

  const [historyLogs, setHistoryLogs] = useState<DispenseLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const logs = await pharmacyService.getDispenseHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredLogs = historyLogs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      log.patient_name.toLowerCase().includes(q) ||
      log.mr_number.toLowerCase().includes(q) ||
      log.token_number.toString().includes(q) ||
      log.doctor_name.toLowerCase().includes(q) ||
      log.dispensed_by.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error('No dispense audit logs to export.');
      return;
    }
    const headers = ['ID', 'Token #', 'MRN', 'Patient Name', 'Doctor Name', 'Items Count', 'Total Amount', 'Payment Status', 'Dispensed At', 'Dispensed By'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.token_number,
      l.mr_number,
      l.patient_name,
      l.doctor_name,
      l.items_count,
      l.total_amount,
      l.payment_status,
      l.dispensed_at,
      l.dispensed_by,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy_dispense_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} dispense audit logs to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-6 w-6 text-teal-600" />
            PH-06 — Dispensing History & Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Complete historical audit trail of all completed medication handovers and transactions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="text-slate-700 bg-white">
            <Download className="h-4 w-4 mr-1.5" />
            Export Audit Logs
          </Button>
          <Button variant="outline" size="sm" onClick={loadHistory} className="text-slate-700 bg-white">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Log
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-3 px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Patient Name, MRN, Token #, Doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredLogs.length} Completed Handover Records
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit history...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Token #</TableHead>
                  <TableHead>Patient & MRN</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Dispensed Medicines Summary</TableHead>
                  <TableHead>Total Bill</TableHead>
                  <TableHead>Handover Timestamp</TableHead>
                  <TableHead>Dispensing Pharmacist</TableHead>
                  <TableHead className="text-right">Audit Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono font-bold text-sm text-slate-900">
                      #{log.token_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">{log.patient_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{log.mr_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{log.doctor_name}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 max-w-xs text-xs">
                        {log.medicines_summary.map((med, i) => (
                          <span key={i} className="block text-[11px] text-slate-600 truncate">
                            • {med}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">
                      {formatCurrency(log.total_amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {format(new Date(log.dispensed_at), 'dd MMM yyyy, hh:mm a')}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{log.dispensed_by}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="completed" className="capitalize text-[10px]">
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
