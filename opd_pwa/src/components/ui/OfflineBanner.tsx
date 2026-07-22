import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#16343C] text-white text-xs px-4 py-2 flex items-center justify-center gap-2 shadow-sm font-medium z-40 sticky top-0"
    >
      <WifiOff className="w-4 h-4 text-[#E9A83A]" />
      <span>You are offline. Displaying cached records.</span>
    </div>
  );
};
