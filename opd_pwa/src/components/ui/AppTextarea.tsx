import React from 'react';
import { clsx } from 'clsx';

export interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const AppTextarea = React.forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const areaId = id || (label ? `area-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-xs font-semibold text-[#16343C] tracking-wide">
            {label}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          className={clsx(
            'w-full text-sm text-[#16343C] bg-white border rounded-[14px] p-3.5 transition-all outline-none placeholder:text-[#708188]/60 focus:ring-2 focus:ring-[#0B6875]/20 focus:border-[#0B6875] resize-none',
            error ? 'border-[#C94B4B]' : 'border-[#DCE6E7]',
            className
          )}
          rows={4}
          {...props}
        />
        {error && <p className="text-xs text-[#C94B4B] font-medium mt-0.5">{error}</p>}
      </div>
    );
  }
);

AppTextarea.displayName = 'AppTextarea';
