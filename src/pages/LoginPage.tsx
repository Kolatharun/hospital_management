import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, User, Building2, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'front-office' as UserRole,
      title: 'Out Patient (OP)',
      description: 'Patient registration, appointments & billing',
      icon: Building2,
      username: 'frontoffice',
    },
    {
      id: 'doctor' as UserRole,
      title: 'Doctor',
      description: 'Patient consultations & prescriptions',
      icon: Stethoscope,
      username: 'doctor',
    },
  ];

  const handleQuickSelect = (roleUsername: string) => {
    setUsername(roleUsername);
    setPassword('');
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <img
          src={logo}
          alt="Balaji Heart Center"
          className="h-20 mx-auto mb-4"
        />
        <p className="text-muted-foreground mt-2">Clinic Management System</p>
        <p className="text-sm text-accent font-medium mt-1">మీ గుండె ఇక పదిలం</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md animate-fade-in border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-primary">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Quick Role Selection */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Select Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = username.toLowerCase() === role.username;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleQuickSelect(role.username)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <Icon
                        className={`w-6 h-6 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'
                          }`}
                      />
                      <div className="font-semibold text-sm">{role.title}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-fade-in">
                {error}
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              disabled={!username.trim() || !password.trim() || isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground">
          2026 Balaji Heart Center. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Contact: +91 9100079990 | balajiheartcenter.hyd@gmail.com
        </p>
      </div>
    </div>
  );
}
