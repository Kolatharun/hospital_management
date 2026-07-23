import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'text';
  size?: 'small' | 'medium' | 'large' | 'full-width';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'large',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-[14px] transition-all duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6875] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none cursor-pointer';

  const variants = {
    primary: 'bg-[#0B6875] text-white hover:bg-[#084F59] active:bg-[#063C44] shadow-sm',
    secondary: 'bg-[#DFF3F5] text-[#0B6875] hover:bg-[#c9ebef] active:bg-[#b0e0e6]',
    outline: 'border border-[#DCE6E7] bg-white text-[#16343C] hover:bg-[#F7F9F8] active:bg-[#EBF1F2]',
    ghost: 'bg-transparent text-[#0B6875] hover:bg-[#DFF3F5]/50 active:bg-[#DFF3F5]',
    destructive: 'bg-[#C94B4B] text-white hover:bg-[#ac3c3c] active:bg-[#913232]',
    text: 'bg-transparent text-[#708188] hover:text-[#16343C] p-0 h-auto min-h-0',
  };

  const sizes = {
    small: 'h-9 px-3 text-xs min-h-[36px]',
    medium: 'h-11 px-4 text-sm min-h-[44px]',
    large: 'h-13 px-6 text-base font-semibold min-h-[50px]',
    'full-width': 'w-full h-13 px-6 text-base font-semibold min-h-[50px]',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
