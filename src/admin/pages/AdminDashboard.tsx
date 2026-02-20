import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Users, Stethoscope, Pill, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsManagement } from '@/admin/components/SettingsManagement';
import { DoctorsManagement } from '@/admin/components/DoctorsManagement';
import { StaffManagement } from '@/admin/components/StaffManagement';
import { MedicinesManagement } from '@/admin/components/MedicinesManagement';
import { DepartmentsManagement } from '@/admin/components/DepartmentsManagement';

type AdminTab = 'settings' | 'departments' | 'doctors' | 'staff' | 'medicines';

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'staff', label: 'Users', icon: Users },
  { id: 'medicines', label: 'Medicines', icon: Pill },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');

  return (
    <PageContainer
      title="Admin Portal"
      actions={
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      }
    >
      {/* Custom Tab Navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === id
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'settings' && <SettingsManagement />}
        {activeTab === 'departments' && <DepartmentsManagement />}
        {activeTab === 'doctors' && <DoctorsManagement />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'medicines' && <MedicinesManagement />}
      </div>
    </PageContainer>
  );
}
