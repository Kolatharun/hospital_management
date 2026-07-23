import React from 'react';
import { Outlet } from 'react-router-dom';
import { OfflineBanner } from '../ui/OfflineBanner';

export const AuthShell: React.FC = () => {
  return (
    <div className="mobile-shell bg-[#F7F9F8]">
      <OfflineBanner />
      <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
        <Outlet />
      </div>
    </div>
  );
};
