import React from 'react';
import { clsx } from 'clsx';

export interface DateCardProps {
  dayLabel: string;
  dateNumber: string;
  monthLabel: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DateCard: React.FC<DateCardProps> = ({
  dayLabel,
  dateNumber,
  monthLabel,
  isSelected = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center p-3 rounded-[16px] border min-w-[72px] transition-all duration-150 cursor-pointer',
        isSelected
          ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-sm scale-[1.02]'
          : 'bg-white text-[#16343C] border-[#DCE6E7] hover:border-[#0B6875]/40'
      )}
    >
      <span className={clsx('text-[11px] font-semibold uppercase tracking-wider', isSelected ? 'text-white/80' : 'text-[#708188]')}>
        {dayLabel}
      </span>
      <span className="text-lg font-extrabold my-0.5">{dateNumber}</span>
      <span className={clsx('text-[10px] font-medium', isSelected ? 'text-white/80' : 'text-[#708188]')}>
        {monthLabel}
      </span>
    </button>
  );
};
