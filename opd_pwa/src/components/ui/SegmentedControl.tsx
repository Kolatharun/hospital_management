import React from 'react';
import { clsx } from 'clsx';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={clsx('flex bg-[#EBF1F2] p-1 rounded-[14px]', className)}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex-1 py-2 text-xs font-semibold rounded-[10px] transition-all duration-150 cursor-pointer text-center',
              isSelected ? 'bg-white text-[#0B6875] shadow-xs' : 'text-[#708188] hover:text-[#16343C]'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
