import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdmin, Medicine } from '@/admin/context/AdminContext';
import { Plus, Upload, Trash2, Download, FileSpreadsheet, Filter, AlertTriangle, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MedicineFormData {
  code: string;
  name: string;
  genericName: string;
  category: string;
  specialization: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
}

const emptyFormData: MedicineFormData = {
  code: '',
  name: '',
  genericName: '',
  category: '',
  specialization: '',
  dosageForm: 'Tablet',
  strength: '',
  manufacturer: '',
};

export function MedicinesManagement() {
  const {
    medicines,
    loading,
    fetchMedicines,
    addMedicine,
    updateMedicine,
    importMedicines,
    deleteMedicine,
    clearMedicinesBySpecialization,
    getSpecializations,
    getCategories
  } = useAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<MedicineFormData>(emptyFormData);
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [importSpecialization, setImportSpecialization] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const specializations = getSpecializations();
  const categories = getCategories(filterSpecialization === 'all' ? undefined : filterSpecialization);

  const filteredMedicines = medicines.filter(m => {
    const matchSpec = filterSpecialization === 'all' || m.specialization === filterSpecialization;
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(search.toLowerCase()) ||
      m.code?.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchCat && matchSearch;
  });

  const handleAdd = () => {
    setEditingMedicine(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      code: med.code || '',
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      specialization: med.specialization,
      dosageForm: med.dosageForm,
      strength: med.strength,
      manufacturer: med.manufacturer || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.specialization || !formData.category) {
      toast.error('Name, Specialization, and Category are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, formData);
        toast.success('Entry updated');
      } else {
        await addMedicine(formData);
        toast.success('Entry added');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteMedicine(id);
        toast.success('Entry deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete');
      }
    }
  };

  const handleClearSpecialization = () => {
    if (!importSpecialization) {
      toast.error('Please select a specialization first');
      return;
    }
    if (confirm(`Delete ALL entries for "${importSpecialization}"?`)) {
      clearMedicinesBySpecialization(importSpecialization);
      toast.success(`All ${importSpecialization} entries deleted`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!importSpecialization) {
      toast.error('Please select a specialization before uploading');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const dataLines = lines.slice(1);

        const newMedicines = dataLines.map(line => {
          const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          const [code, category, name, genericName, dosageForm, strength, manufacturer] = cols;
          return {
            code: code || '',
            category: category || '',
            name: name || '',
            genericName: genericName || '',
            specialization: importSpecialization,
            dosageForm: dosageForm || 'Tablet',
            strength: strength || '',
            manufacturer: manufacturer || '',
          };
        }).filter(m => m.name);

        if (newMedicines.length === 0) {
          toast.error('No valid entries found in CSV');
          return;
        }

        await importMedicines(newMedicines);
        toast.success(`${newMedicines.length} entries imported successfully`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error: any) {
        toast.error(error.message || 'Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleData = `Code,Category,Name,Generic Name,Dosage Form,Strength,Manufacturer
D001,Blood Pressure,Amlodipine,Amlodipine Besylate,Tablet,5mg,Cipla
D002,Blood Pressure,Aspirin,Acetylsalicylic Acid,Tablet,75mg,Bayer
D003,CAD,Atorvastatin,Atorvastatin Calcium,Tablet,10mg,Pfizer
D004,Heart Failure,Metoprolol,Metoprolol Tartrate,Tablet,50mg,AstraZeneca`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicines_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-xl">Bulk Import from CSV</CardTitle>
              <CardDescription>
                Upload a CSV with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">Code, Category, Name, Generic Name, Dosage Form, Strength, Manufacturer</code>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Specialization *</Label>
              <Input
                placeholder="e.g. Cardiology"
                value={importSpecialization}
                onChange={(e) => setImportSpecialization(e.target.value)}
                list="spec-list"
                className="mt-1"
              />
              <datalist id="spec-list">
                {specializations.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <Label>Upload CSV File</Label>
              <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadSampleCSV} className="gap-2 flex-1">
                <Download className="h-4 w-4" />
                Sample CSV
              </Button>
              <Button variant="destructive" onClick={handleClearSpecialization} disabled={!importSpecialization} className="gap-2 flex-1">
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Importing will <strong>add</strong> to existing entries. Use "Clear All" first if you want to replace data for a specialization.</span>
          </div>
        </CardContent>
      </Card>

      {/* Medicines List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl">Medicines & Diagnoses</CardTitle>
            <CardDescription>{filteredMedicines.length} entries found</CardDescription>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            </div>
            <Input
              placeholder="Search by name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 h-8 text-sm"
            />
            <Select value={filterSpecialization} onValueChange={(v) => { setFilterSpecialization(v); setFilterCategory('all'); }}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading.medicines ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-bold w-20">Code</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Generic Name</TableHead>
                  <TableHead className="font-bold">Specialization</TableHead>
                  <TableHead className="font-bold">Form</TableHead>
                  <TableHead className="font-bold">Strength</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((med) => (
                  <TableRow key={med.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">{med.code || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{med.category || '-'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{med.genericName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{med.specialization}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{med.dosageForm}</TableCell>
                    <TableCell className="text-sm">{med.strength || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(med)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(med.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMedicines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No entries found. Add medicines or import from CSV.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMedicine ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
            <DialogDescription>Medicine / Diagnosis details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code</Label>
                <Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="D001" className="mt-1" />
              </div>
              <div>
                <Label>Category *</Label>
                <Input value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="Blood Pressure" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Amlodipine" className="mt-1" />
            </div>
            <div>
              <Label>Generic Name</Label>
              <Input value={formData.genericName} onChange={(e) => setFormData(p => ({ ...p, genericName: e.target.value }))} placeholder="Amlodipine Besylate" className="mt-1" />
            </div>
            <div>
              <Label>Specialization *</Label>
              <Input value={formData.specialization} onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))} placeholder="Cardiology" list="spec-list" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosage Form</Label>
                <Select value={formData.dosageForm} onValueChange={(v) => setFormData(p => ({ ...p, dosageForm: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Powder', 'Inhaler'].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Strength</Label>
                <Input value={formData.strength} onChange={(e) => setFormData(p => ({ ...p, strength: e.target.value }))} placeholder="5mg" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Manufacturer</Label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData(p => ({ ...p, manufacturer: e.target.value }))} placeholder="Cipla" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMedicine ? 'Update' : 'Add'} Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
