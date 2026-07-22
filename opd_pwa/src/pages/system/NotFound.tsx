import React from 'react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { AppButton } from '../../components/ui/AppButton';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const nav = useAppNavigation();

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-6xl font-black text-[#0B6875] tracking-tight mb-2">404</h1>
      <h2 className="text-lg font-bold text-[#16343C]">Page Not Found</h2>
      <p className="text-xs text-[#708188] max-w-xs mt-1 mb-6">
        The requested page does not exist or has been moved.
      </p>

      <AppButton size="medium" leftIcon={<Home className="w-4 h-4" />} onClick={nav.goHome}>
        Return to Home Dashboard
      </AppButton>
    </div>
  );
};
