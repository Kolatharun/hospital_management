import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdmin, Doctor, Staff } from '@/admin/context/AdminContext';
import { adminUserService } from '@/services/adminService';
import { ApiFieldError } from '@/services/api';
import { Plus, Pencil, Trash2, Stethoscope, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DoctorFormData {
  name: string;
  speciality: string;
  qualification: string;
  registrationNumber: string;
  phone: string;
  email: string;
  room: string;
  consultationFee: string;
  departmentId: string;
  userId: string;
  isAvailable: boolean;
}

const emptyFormData: DoctorFormData = {
  name: '',
  speciality: '',
  qualification: '',
  registrationNumber: '',
  phone: '',
  email: '',
  room: '',
  consultationFee: '',
  departmentId: '',
  userId: '',
  isAvailable: true,
};

export function DoctorsManagement() {
  const {
    doctors,
    departments,
    staff,
    loading,
    fetchDoctors,
    fetchDepartments,
    fetchStaff,
    addDoctor,
    updateDoctor,
    deleteDoctor
  } = useAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Staff[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ registration_number?: string; email?: string; user_id?: string }>({});

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
    fetchStaff();
  }, [fetchDoctors, fetchDepartments, fetchStaff]);

  // Fetch unlinked doctor users when dialog opens
  const fetchAvailableUsers = useCallback(async (currentLinkedUserId?: string | null) => {
    setLoadingUsers(true);
    try {
      const unlinkedUsers = await adminUserService.getUnlinkedDoctorUsers();
      // Transform API response to Staff format
      const transformedUsers: Staff[] = unlinkedUsers.map(u => ({
        id: u.id,
        name: u.display_name,
        role: u.role,
        username: u.username,
        email: u.email || '',
        phone: '',
        isActive: u.is_active,
      }));

      // If editing and there's a currently linked user, include them in the list
      if (currentLinkedUserId) {
        const currentUser = staff.find(s => s.id === currentLinkedUserId);
        if (currentUser && !transformedUsers.some(u => u.id === currentLinkedUserId)) {
          transformedUsers.unshift(currentUser);
        }
      }

      setAvailableUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch unlinked users:', error);
      // Fallback to filtering from staff list
      const doctorUsers = staff.filter(s => s.role === 'doctor' && s.isActive);
      setAvailableUsers(doctorUsers);
    } finally {
      setLoadingUsers(false);
    }
  }, [staff]);

  // Handle user selection - auto-populate fields
  const handleUserSelect = (userId: string) => {
    if (userId === 'none') {
      setFormData(p => ({ ...p, userId: '' }));
      return;
    }

    const selectedUser = availableUsers.find(u => u.id === userId);
    if (selectedUser) {
      setFormData(p => ({
        ...p,
        userId: userId,
        // Auto-populate name if empty
        name: p.name || selectedUser.name,
        // Auto-populate email if empty
        email: p.email || selectedUser.email,
        // Auto-populate phone if empty (if user has phone)
        phone: p.phone || selectedUser.phone || '',
      }));
    } else {
      setFormData(p => ({ ...p, userId }));
    }
  };

  const handleAdd = () => {
    setEditingDoctor(null);
    setFormData(emptyFormData);
    setFieldErrors({});
    fetchAvailableUsers(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      speciality: doctor.speciality,
      qualification: doctor.qualification,
      registrationNumber: doctor.registrationNumber,
      phone: doctor.phone,
      email: doctor.email,
      room: doctor.room,
      consultationFee: doctor.consultationFee?.toString() || '',
      departmentId: doctor.departmentId || '',
      userId: doctor.userId || '',
      isAvailable: doctor.isAvailable,
    });
    setFieldErrors({});
    // Pass the currently linked user ID so it's included in available users
    fetchAvailableUsers(doctor.userId);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFieldErrors({});

    if (!formData.name.trim()) {
      toast.error('Please enter doctor name');
      return;
    }

    setSubmitting(true);
    try {
      const doctorData = {
        name: formData.name.trim(),
        speciality: formData.speciality.trim(),
        qualification: formData.qualification.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        room: formData.room.trim(),
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
        departmentId: formData.departmentId || null,
        userId: formData.userId || null,
        isAvailable: formData.isAvailable,
      };

      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, doctorData);
        toast.success('Doctor updated successfully');
      } else {
        await addDoctor(doctorData);
        toast.success('Doctor added successfully');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      if (error instanceof ApiFieldError) {
        setFieldErrors({ [error.field]: error.message });
      } else {
        toast.error(error.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        await deleteDoctor(id);
        toast.success('Doctor deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete doctor');
      }
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return '-';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '-';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-xl">Doctors</CardTitle>
            <CardDescription>Manage clinic doctors, departments, and user accounts</CardDescription>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </CardHeader>
      <CardContent>
        {loading.doctors ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Department</TableHead>
                <TableHead className="font-bold">Speciality</TableHead>
                <TableHead className="font-bold">Reg. No.</TableHead>
                <TableHead className="font-bold">Room</TableHead>
                <TableHead className="font-bold">Fee</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div>
                      <div className="font-semibold">{doctor.name}</div>
                      <div className="text-xs text-muted-foreground">{doctor.qualification}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDepartmentName(doctor.departmentId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doctor.speciality || '-'}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{doctor.registrationNumber || '-'}</TableCell>
                  <TableCell>{doctor.room || '-'}</TableCell>
                  <TableCell className="font-mono">
                    {doctor.consultationFee ? `₹${doctor.consultationFee}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={doctor.isAvailable ? 'default' : 'destructive'}>
                      {doctor.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(doctor)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(doctor.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {doctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No doctors added yet. Click "Add Doctor" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            <DialogDescription>
              {editingDoctor ? 'Update doctor information and assignments' : 'Enter doctor details, department, and user linkage'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="dName">Full Name *</Label>
                <Input
                  id="dName"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dDept">Department</Label>
                <Select
                  value={formData.departmentId || 'none'}
                  onValueChange={(value) => setFormData(p => ({ ...p, departmentId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.filter(d => d.isActive).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dSpec">Speciality</Label>
                <Input
                  id="dSpec"
                  value={formData.speciality}
                  onChange={(e) => setFormData(p => ({ ...p, speciality: e.target.value }))}
                  placeholder="Interventional Cardiology"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dQual">Qualification</Label>
                <Input
                  id="dQual"
                  value={formData.qualification}
                  onChange={(e) => setFormData(p => ({ ...p, qualification: e.target.value }))}
                  placeholder="MD, DM (Cardiology)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dRegNo">Registration Number</Label>
                <Input
                  id="dRegNo"
                  value={formData.registrationNumber}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, registrationNumber: e.target.value }));
                    if (fieldErrors.registration_number) setFieldErrors(p => ({ ...p, registration_number: undefined }));
                  }}
                  placeholder="MCI-12345"
                  className={`mt-1 ${fieldErrors.registration_number ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {fieldErrors.registration_number && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <span>✕</span> {fieldErrors.registration_number}
                  </p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dPhone">Phone</Label>
                <Input
                  id="dPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dEmail">Email</Label>
                <Input
                  id="dEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, email: e.target.value }));
                    if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined }));
                  }}
                  placeholder="doctor@clinic.com"
                  className={`mt-1 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <span>✕</span> {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Clinic Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dRoom">Room Number</Label>
                <Input
                  id="dRoom"
                  value={formData.room}
                  onChange={(e) => setFormData(p => ({ ...p, room: e.target.value }))}
                  placeholder="Room 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dFee">Consultation Fee (₹)</Label>
                <Input
                  id="dFee"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData(p => ({ ...p, consultationFee: e.target.value }))}
                  placeholder="500"
                  className="mt-1"
                />
              </div>
            </div>

            {/* User Account Linkage */}
            <div>
              <Label htmlFor="dUser">Link to User Account</Label>
              <Select
                value={formData.userId || 'none'}
                onValueChange={(value) => {
                  handleUserSelect(value);
                  if (fieldErrors.user_id) setFieldErrors(p => ({ ...p, user_id: undefined }));
                }}
                disabled={loadingUsers}
              >
                <SelectTrigger className={`mt-1 ${fieldErrors.user_id ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user account (for login)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No User Account</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} (@{user.username})
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && !loadingUsers && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No unlinked doctor users available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {fieldErrors.user_id ? (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <span>✕</span> {fieldErrors.user_id}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Link this doctor to a user account to allow them to login.
                  {availableUsers.length > 0 && " Selecting a user will auto-populate name and email fields."}
                </p>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="dAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isAvailable: checked }))}
              />
              <Label htmlFor="dAvailable">Available for Consultations</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDoctor ? 'Update' : 'Add'} Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
