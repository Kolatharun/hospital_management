import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdmin, Department } from '@/admin/context/AdminContext';
import { Plus, Pencil, Trash2, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  baseConsultationFee: string;
  isActive: boolean;
}

const emptyFormData: DepartmentFormData = {
  name: '',
  code: '',
  description: '',
  baseConsultationFee: '300',
  isActive: true,
};

export function DepartmentsManagement() {
  const {
    departments,
    doctors,
    loading,
    fetchDepartments,
    fetchDoctors,
    addDepartment,
    updateDepartment,
    deleteDepartment
  } = useAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, [fetchDepartments, fetchDoctors]);

  const handleAdd = () => {
    setEditingDepartment(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description,
      baseConsultationFee: department.baseConsultationFee.toString(),
      isActive: department.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please enter department name and code');
      return;
    }

    const fee = parseFloat(formData.baseConsultationFee);
    if (isNaN(fee) || fee < 0) {
      toast.error('Please enter a valid consultation fee');
      return;
    }

    setSubmitting(true);
    try {
      const deptData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        baseConsultationFee: fee,
        isActive: formData.isActive,
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, deptData);
        toast.success('Department updated successfully');
      } else {
        await addDepartment(deptData);
        toast.success('Department added successfully');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const linkedDoctors = doctors.filter(d => d.departmentId === id);
    if (linkedDoctors.length > 0) {
      toast.error(`Cannot delete: ${linkedDoctors.length} doctor(s) are linked to this department`);
      return;
    }

    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        toast.success('Department deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete department');
      }
    }
  };

  const getDoctorCount = (deptId: string) => {
    return doctors.filter(d => d.departmentId === deptId).length;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-xl">Departments</CardTitle>
            <CardDescription>Manage clinic departments and base consultation fees</CardDescription>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </CardHeader>
      <CardContent>
        {loading.departments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Code</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Base Fee</TableHead>
                <TableHead className="font-bold">Doctors</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-muted/40">
                  <TableCell className="font-semibold">{dept.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{dept.code}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {dept.description || '-'}
                  </TableCell>
                  <TableCell className="font-mono">₹{dept.baseConsultationFee}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getDoctorCount(dept.id)} doctors</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.isActive ? 'default' : 'destructive'}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(dept.id)}
                        disabled={getDoctorCount(dept.id) > 0}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No departments added yet. Click "Add Department" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? 'Update department details' : 'Create a new department for the clinic'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Department Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Cardiology"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Department Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="CARDIO"
                className="mt-1 font-mono"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier (e.g., CARDIO, GENMED, ORTHO)
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Heart and cardiovascular care"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Base Consultation Fee (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={formData.baseConsultationFee}
                onChange={(e) => setFormData(p => ({ ...p, baseConsultationFee: e.target.value }))}
                placeholder="300"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default fee for consultations in this department
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isActive: checked }))}
              />
              <Label>Active Department</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDepartment ? 'Update' : 'Add'} Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
