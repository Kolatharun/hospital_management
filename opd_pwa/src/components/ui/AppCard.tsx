import React from 'react';
import { clsx } from 'clsx';

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'highlight';
}

export const AppCard: React.FC<AppCardProps> = ({ children, variant = 'default', className, ...props }) => {
  const base = 'bg-white rounded-[18px] border border-[#DCE6E7] p-4 transition-all duration-150';
  const variants = {
    default: 'shadow-[0_2px_8px_rgba(22,52,60,0.04)]',
    flat: 'shadow-none bg-[#F7F9F8]',
    interactive: 'shadow-[0_2px_8px_rgba(22,52,60,0.04)] hover:border-[#0B6875]/40 hover:shadow-md cursor-pointer active:scale-[0.995]',
    highlight: 'bg-[#DFF3F5]/30 border-[#0B6875]/30 shadow-none',
  };

  return (
    <div className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
