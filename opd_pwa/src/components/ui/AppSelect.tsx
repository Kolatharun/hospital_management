import React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const AppSelect = React.forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#16343C] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            className={clsx(
              'w-full h-12 text-sm text-[#16343C] bg-white border rounded-[14px] px-3.5 pr-10 appearance-none transition-all outline-none focus:ring-2 focus:ring-[#0B6875]/20 focus:border-[#0B6875]',
              error ? 'border-[#C94B4B]' : 'border-[#DCE6E7]',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-5 h-5 text-[#708188] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-[#C94B4B] font-medium mt-0.5">{error}</p>}
      </div>
    );
  }
);

AppSelect.displayName = 'AppSelect';
