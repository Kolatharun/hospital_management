import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Stethoscope, User } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = user.role === 'doctor' ? 'Doctor' : 'Front Office';
  const roleIcon = user.role === 'doctor' ? Stethoscope : User;
  const RoleIcon = roleIcon;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Clinic Name */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Balaji Heart Center" 
              className="h-10"
            />
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RoleIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
              <Badge variant="secondary" className="font-medium">
                {roleLabel}
              </Badge>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
