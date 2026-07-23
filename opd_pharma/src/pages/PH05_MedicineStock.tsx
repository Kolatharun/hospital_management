import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react';
import { pharmacyService } from '../services/pharmacyService';
import { DrugStockItem } from '../types/pharmacy';
import { usePharmacyStore } from '../store/usePharmacyStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export const PH05_MedicineStock: React.FC = () => {
  const { searchQuery, setSearchQuery, openStockModal } = usePharmacyStore();

  const [stockItems, setStockItems] = useState<DrugStockItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const data = await pharmacyService.getStockInventory();
      setStockItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const filteredItems = stockItems.filter((item) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'low_stock'
        ? item.status === 'low_stock'
        : activeTab === 'expiring'
        ? item.status === 'expiring_soon'
        : activeTab === 'out_of_stock'
        ? item.status === 'out_of_stock'
        : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.brand_name.toLowerCase().includes(q) ||
      item.generic_name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.rack_location.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error('No inventory items to export.');
      return;
    }
    const headers = ['ID', 'Brand Name', 'Generic Name', 'Category', 'Rack Location', 'Total Stock', 'Reorder Level', 'Unit Price', 'Status'];
    const rows = filteredItems.map((i) => [
      i.id,
      i.brand_name,
      i.generic_name,
      i.category,
      i.rack_location,
      i.total_stock,
      i.reorder_level,
      i.unit_price,
      i.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy_stock_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredItems.length} inventory items to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-teal-600" />
            PH-05 — Medicine Stock & Inventory Station
          </h1>
          <p className="text-xs text-slate-500">
            Monitor real-time pharmacy drug stock levels, batch expiries, reorder thresholds & shelf locations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-slate-700 bg-white">
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="medical" size="sm" onClick={() => openStockModal()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Stock
          </Button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-3 px-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all" className="text-xs font-medium px-4">
                All Inventory ({stockItems.length})
              </TabsTrigger>
              <TabsTrigger value="low_stock" className="text-xs font-medium px-4">
                Low Stock ({stockItems.filter((i) => i.status === 'low_stock').length})
              </TabsTrigger>
              <TabsTrigger value="expiring" className="text-xs font-medium px-4">
                Expiring Soon ({stockItems.filter((i) => i.status === 'expiring_soon').length})
              </TabsTrigger>
              <TabsTrigger value="out_of_stock" className="text-xs font-medium px-4">
                Out of Stock ({stockItems.filter((i) => i.status === 'out_of_stock').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search Medicine, Generic, Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading stock inventory...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name & Generic Composition</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rack / Location</TableHead>
                  <TableHead>Total Stock Units</TableHead>
                  <TableHead>Reorder Threshold</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockPercent = Math.min(100, Math.round((item.total_stock / (item.reorder_level * 3)) * 100));

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{item.brand_name}</span>
                          <span className="text-[11px] text-slate-500">{item.generic_name} ({item.manufacturer})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-50">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" />
                        {item.rack_location}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <span className="font-mono font-bold text-slate-900 text-sm">{item.total_stock} Units</span>
                          <Progress value={stockPercent} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {item.reorder_level} Units
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'in_stock'
                              ? 'ready'
                              : item.status === 'low_stock'
                              ? 'pending'
                              : 'destructive'
                          }
                          className="capitalize text-[10px]"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockModal(item)}
                          className="text-xs"
                        >
                          Adjust Stock
                        </Button>
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
