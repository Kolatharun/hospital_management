import React from 'react';
import { clsx } from 'clsx';

export interface FilterChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, isSelected = false, onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap cursor-pointer',
        isSelected
          ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-xs'
          : 'bg-white text-[#708188] border-[#DCE6E7] hover:border-[#0B6875]/40 hover:text-[#16343C]',
        className
      )}
    >
      {label}
    </button>
  );
};
