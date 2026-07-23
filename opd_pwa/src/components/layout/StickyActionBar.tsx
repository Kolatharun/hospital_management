import React from 'react';

export interface StickyActionBarProps {
  children: React.ReactNode;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white/95 backdrop-blur-xs border-t border-[#DCE6E7] p-4 safe-padding-bottom shadow-lg">
      <div className="w-full max-w-[480px] flex items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
};
