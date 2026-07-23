import React from 'react';
import { clsx } from 'clsx';

export interface TimeSlotProps {
  time: string;
  isAvailable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  time,
  isAvailable = true,
  isSelected = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={onClick}
      className={clsx(
        'px-3 py-2.5 rounded-[12px] text-xs font-semibold border transition-all duration-150 text-center cursor-pointer disabled:pointer-events-none',
        isSelected
          ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-xs'
          : isAvailable
          ? 'bg-white text-[#16343C] border-[#DCE6E7] hover:border-[#0B6875]/40'
          : 'bg-[#F7F9F8] text-[#BAC6C9] border-[#DCE6E7] line-through'
      )}
    >
      {time}
    </button>
  );
};
