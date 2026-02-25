import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Eye, EyeOff, Phone, Mail, MapPin, Heart, Globe } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

interface FieldErrors {
  usernameOrEmail?: string;
  password?: string;
}

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email is required';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="w-5 h-5 animate-pulse" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-20">

          {/* Left Side - Branding Section */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center text-center lg:text-left">
            {/* Logo */}
            <div className="mb-6">
              <img
                src={logo}
                alt="Balaji Heart Center"
                className="h-28 lg:h-36 w-auto object-contain drop-shadow-md"
              />
            </div>

            {/* Clinic Name */}
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 tracking-wide mb-2">
              BALAJI HEART CENTER
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 text-base lg:text-lg mb-3">
              Clinic Management System
            </p>

            {/* Telugu Tagline */}
            <p className="text-rose-600 font-medium text-lg lg:text-xl mb-8 italic">
              మీ గుండె ఇక పదిలం
            </p>

            {/* Contact Information */}
            <div className="space-y-3 text-base text-gray-500">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>Hyderabad, Telangana, India</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Phone className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>+91 9100079990</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Mail className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>balajiheartcenter.hyd@gmail.com</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Globe className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <a
                  href="http://www.balajiheartcenter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                >
                  www.balajiheartcenter.com
                </a>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
              {/* Card Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Welcome Back
                </h2>
                <p className="text-base text-gray-500">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} noValidate className="space-y-5">
                {/* Username/Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail" className="text-base font-medium text-gray-700">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="usernameOrEmail"
                      type="text"
                      placeholder="Enter your username or email"
                      value={usernameOrEmail}
                      onChange={(e) => {
                        setUsernameOrEmail(e.target.value);
                        setError('');
                        setFieldErrors((prev) => ({ ...prev, usernameOrEmail: undefined }));
                      }}
                      className={`pl-12 h-12 text-base bg-gray-50/50 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg transition-colors ${fieldErrors.usernameOrEmail ? 'border-red-400' : ''}`}
                      autoComplete="username"
                    />
                  </div>
                  {fieldErrors.usernameOrEmail && (
                    <p className="text-sm text-red-600">{fieldErrors.usernameOrEmail}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className={`pl-12 pr-12 h-12 text-base bg-gray-50/50 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg transition-colors ${fieldErrors.password ? 'border-red-400' : ''}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-base text-red-600 bg-red-50 border border-red-100 p-4 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-400">
                  © 2026 Balaji Heart Center. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
