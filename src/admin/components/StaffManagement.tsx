import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdmin, Staff } from '@/admin/context/AdminContext';
import { Plus, Pencil, Trash2, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaffFormData {
  name: string;
  role: 'admin' | 'front-office' | 'doctor';
  username: string;
  password: string;
  email: string;
  isActive: boolean;
}

const emptyFormData: StaffFormData = {
  name: '',
  role: 'front-office',
  username: '',
  password: '',
  email: '',
  isActive: true,
};

const roleLabels: Record<string, string> = {
  'admin': 'Admin',
  'front-office': 'Front Office',
  'doctor': 'Doctor',
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'admin': 'destructive',
  'front-office': 'secondary',
  'doctor': 'default',
};

export function StaffManagement() {
  const { staff, loading, fetchStaff, addStaff, updateStaff, deleteStaff } = useAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(emptyFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData(emptyFormData);
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      role: member.role,
      username: member.username,
      password: '',
      email: member.email,
      isActive: member.isActive,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      toast.error('Please fill in name and username');
      return;
    }

    if (!editingStaff && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    if (!editingStaff && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          isActive: formData.isActive,
        });
        toast.success('Staff member updated');
      } else {
        await addStaff({
          name: formData.name.trim(),
          role: formData.role,
          username: formData.username.trim(),
          password: formData.password,
          email: formData.email.trim(),
          phone: '',
          isActive: formData.isActive,
        });
        toast.success('Staff member added');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        toast.success('Staff member deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete staff member');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>Manage user accounts for admin, front-office, and doctors</CardDescription>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        {loading.staff ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold">Username</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/40">
                  <TableCell className="font-semibold">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariants[member.role] || 'secondary'}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{member.username}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'default' : 'destructive'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No users added yet. Click "Add User" to get started.
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
            <DialogTitle>{editingStaff ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Display Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'front-office' | 'doctor') => setFormData(p => ({ ...p, role: value }))}
                disabled={!!editingStaff}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="front-office">Front Office</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
              {editingStaff && (
                <p className="text-xs text-muted-foreground mt-1">Role cannot be changed after creation</p>
              )}
            </div>
            <div>
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                placeholder="john.doe"
                className="mt-1"
                disabled={!!editingStaff}
              />
              {editingStaff ? (
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Letters, numbers, dots, and underscores only</p>
              )}
            </div>
            {!editingStaff && (
              <div>
                <Label>Password *</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Password is hashed securely on the server
                </p>
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="john@clinic.com"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isActive: checked }))}
              />
              <Label>Active Account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStaff ? 'Update' : 'Add'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
