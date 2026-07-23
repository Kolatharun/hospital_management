import React, { useState } from 'react';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { pharmacyService } from '../../services/pharmacyService';
import { toast } from 'sonner';

export const StockAdjustModal: React.FC = () => {
  const { isStockModalOpen, selectedStockForEdit, closeStockModal } = usePharmacyStore();

  const [deltaQty, setDeltaQty] = useState<number>(10);
  const [reason, setReason] = useState<string>('New Stock Receipt from Central Pharmacy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isStockModalOpen) return null;

  const isNewItem = !selectedStockForEdit;

  const handleSaveStock = async () => {
    setIsSubmitting(true);
    try {
      if (selectedStockForEdit) {
        await pharmacyService.updateStockItem(selectedStockForEdit.id, deltaQty, reason);
        toast.success(`Updated stock for ${selectedStockForEdit.brand_name}!`);
      } else {
        await pharmacyService.addStockItem({
          brand_name: 'Tab. Rosuvastatin 10mg',
          generic_name: 'Rosuvastatin',
          category: 'Cardiology Special',
          dosage_form: 'Tablet',
          strength: '10 mg',
          manufacturer: 'AstraZeneca India',
          rack_location: 'Rack A-12',
          total_stock: 100,
          reorder_level: 30,
          unit_price: 18.5,
          status: 'in_stock',
          batches: [
            { batch_number: 'ROS-2026-N1', expiry_date: '2028-05-30', quantity: 100, mfg_date: '2026-01-01' },
          ],
        });
        toast.success('Added new medicine stock item!');
      }
      closeStockModal();
    } catch (err) {
      toast.error('Failed to update stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isStockModalOpen} onOpenChange={(open) => !open && closeStockModal()}>
      <DialogContent className="sm:max-w-md bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            {isNewItem ? 'Add New Medicine Stock' : `Adjust Stock — ${selectedStockForEdit.brand_name}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            {selectedStockForEdit
              ? `Current Total Stock: ${selectedStockForEdit.total_stock} units (${selectedStockForEdit.rack_location})`
              : 'Add new medicine batch into pharmacy inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {selectedStockForEdit ? (
            <>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Quantity Adjustment (+/- Units)</label>
                <Input
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(Number(e.target.value))}
                  placeholder="e.g. +50 or -10"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Adjustment Reason</label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Central Supply Intake, Damage Return, Audit Correction"
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-900 text-xs">
              <p className="font-bold">Quick Inventory Entry</p>
              <p className="text-[11px] text-teal-800">
                Clicking confirm will populate standard cardiology stock item (Rosuvastatin 10mg) with initial batch details.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" size="sm" onClick={closeStockModal}>
            Cancel
          </Button>
          <Button variant="medical" size="sm" disabled={isSubmitting} onClick={handleSaveStock}>
            {isSubmitting ? 'Saving...' : 'Save Stock Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
