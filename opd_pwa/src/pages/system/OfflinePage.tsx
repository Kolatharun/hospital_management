import React from 'react';
import { AppButton } from '../../components/ui/AppButton';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 bg-[#16343C] text-[#E9A83A] rounded-full flex items-center justify-center mb-4 shadow-md">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-[#16343C]">You Are Currently Offline</h1>
      <p className="text-xs text-[#708188] max-w-xs mt-1 mb-6">
        Please check your mobile data or Wi-Fi connection. Cached medical records remain accessible.
      </p>

      <AppButton
        size="medium"
        leftIcon={<RefreshCw className="w-4 h-4" />}
        onClick={() => window.location.reload()}
      >
        Retry Connection
      </AppButton>
    </div>
  );
};
