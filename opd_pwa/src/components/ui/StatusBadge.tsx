import React from 'react';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'neutral', className }) => {
  const styles = {
    success: 'bg-[#23866A]/10 text-[#23866A] border-[#23866A]/20',
    warning: 'bg-[#E9A83A]/10 text-[#a06a10] border-[#E9A83A]/20',
    error: 'bg-[#C94B4B]/10 text-[#C94B4B] border-[#C94B4B]/20',
    info: 'bg-[#0B6875]/10 text-[#0B6875] border-[#0B6875]/20',
    neutral: 'bg-[#708188]/10 text-[#708188] border-[#708188]/20',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide whitespace-nowrap',
        styles[variant],
        className
      )}
    >
      {label}
    </span>
  );
};
