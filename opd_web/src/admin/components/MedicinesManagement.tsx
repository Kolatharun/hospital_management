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
import { CSVMedicineRow } from '@/services/adminService';
import { Plus, Trash2, Download, FileSpreadsheet, Filter, AlertTriangle, Pencil, Loader2, Save, X, CheckCircle2, XCircle } from 'lucide-react';
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
    deleteMedicine,
    clearMedicinesBySpecialization,
    parseCSV,
    bulkSaveMedicines,
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

  // CSV Preview State
  const [csvPreview, setCsvPreview] = useState<CSVMedicineRow[]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvSaving, setCsvSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStats, setPreviewStats] = useState({ total: 0, valid: 0, invalid: 0 });

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

  const handleClearSpecialization = async () => {
    if (!importSpecialization) {
      toast.error('Please select a specialization first');
      return;
    }
    if (confirm(`Delete ALL entries for "${importSpecialization}"?`)) {
      try {
        const result = await clearMedicinesBySpecialization(importSpecialization);
        if (result.success) {
          toast.success(`Deleted ${result.deleted} ${importSpecialization} entries`);
        } else {
          toast.error('Failed to clear entries');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to clear entries');
      }
    }
  };

  // Parse CSV and show preview - does NOT insert into database
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!importSpecialization) {
      toast.error('Please select a specialization before uploading');
      return;
    }

    setCsvParsing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvContent = event.target?.result as string;

        // Call API to parse CSV - this does NOT insert into database
        const result = await parseCSV(csvContent, importSpecialization);

        if (!result.success) {
          toast.error(result.errors.join(', ') || 'Failed to parse CSV');
          setCsvParsing(false);
          return;
        }

        if (result.preview.length === 0) {
          toast.error('No entries found in CSV');
          setCsvParsing(false);
          return;
        }

        // Show preview - user must click Save to insert
        setCsvPreview(result.preview);
        setPreviewStats({
          total: result.total_rows,
          valid: result.valid_rows,
          invalid: result.invalid_rows,
        });
        setShowPreview(true);
        toast.info(`Parsed ${result.total_rows} rows. Review and click Save to import.`);
      } catch (error: any) {
        toast.error(error.message || 'Error parsing CSV file');
      } finally {
        setCsvParsing(false);
      }
    };
    reader.readAsText(file);
  };

  // Save parsed CSV data to database - only called when Save button is clicked
  const handleSaveCSV = async () => {
    const validRows = csvPreview.filter(row => row.is_valid);
    if (validRows.length === 0) {
      toast.error('No valid rows to save');
      return;
    }

    setCsvSaving(true);
    try {
      const medicinesToSave = validRows.map(row => ({
        code: row.code,
        name: row.name,
        genericName: row.generic_name || '',
        category: row.category,
        specialization: importSpecialization,
        dosageForm: row.dosage_form || 'Tablet',
        strength: row.strength || '',
        manufacturer: row.manufacturer || '',
      }));

      const result = await bulkSaveMedicines(medicinesToSave, importSpecialization);

      if (result.success) {
        toast.success(`Successfully imported ${result.inserted} medicines`);
        handleCancelPreview();
      } else {
        toast.error(result.message || 'Failed to save medicines');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save medicines');
    } finally {
      setCsvSaving(false);
    }
  };

  // Cancel preview and reset state
  const handleCancelPreview = () => {
    setCsvPreview([]);
    setShowPreview(false);
    setPreviewStats({ total: 0, valid: 0, invalid: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                disabled={showPreview}
              />
              <datalist id="spec-list">
                {specializations.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <Label>Upload CSV File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1"
                disabled={csvParsing || showPreview}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadSampleCSV} className="gap-2 flex-1" disabled={showPreview}>
                <Download className="h-4 w-4" />
                Sample CSV
              </Button>
              <Button variant="destructive" onClick={handleClearSpecialization} disabled={!importSpecialization || showPreview} className="gap-2 flex-1">
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* CSV Parsing Indicator */}
          {csvParsing && (
            <div className="flex items-center justify-center py-8 bg-muted/30 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Parsing CSV file...</span>
            </div>
          )}

          {/* CSV Preview Section */}
          {showPreview && (
            <div className="space-y-4 border border-primary/30 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-lg">CSV Preview</h3>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">{previewStats.total} Total</Badge>
                    <Badge variant="default" className="bg-green-600">{previewStats.valid} Valid</Badge>
                    {previewStats.invalid > 0 && (
                      <Badge variant="destructive">{previewStats.invalid} Invalid</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelPreview} disabled={csvSaving}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCSV} disabled={csvSaving || previewStats.valid === 0}>
                    {csvSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save {previewStats.valid} Entries
                  </Button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Generic Name</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Strength</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.map((row) => (
                      <TableRow
                        key={row.row_number}
                        className={row.is_valid ? '' : 'bg-destructive/10'}
                      >
                        <TableCell className="text-xs text-muted-foreground">{row.row_number}</TableCell>
                        <TableCell>
                          {row.is_valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.code || '-'}</TableCell>
                        <TableCell className="text-sm">{row.category || '-'}</TableCell>
                        <TableCell className="font-medium">{row.name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.generic_name || '-'}</TableCell>
                        <TableCell className="text-sm">{row.dosage_form || '-'}</TableCell>
                        <TableCell className="text-sm">{row.strength || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {previewStats.invalid > 0 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
                  <span><strong>{previewStats.invalid}</strong> rows have errors and will be skipped. Only valid rows will be saved.</span>
                </div>
              )}
            </div>
          )}

          {!showPreview && (
            <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg text-muted-foreground text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>CSV will be parsed for <strong>preview only</strong>. You must click <strong>Save</strong> to import data. Use "Clear All" first if you want to replace existing data.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicines List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl">Medicines</CardTitle>
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
