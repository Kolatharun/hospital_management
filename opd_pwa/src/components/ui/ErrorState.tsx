import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We encountered an error loading this information. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[18px] border border-[#C94B4B]/20 my-4">
      <div className="p-4 mb-3 rounded-full bg-[#C94B4B]/10 text-[#C94B4B]">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-[#16343C] mb-1">{title}</h3>
      <p className="text-xs text-[#708188] max-w-xs mb-4 leading-relaxed">{description}</p>
      {onRetry && (
        <AppButton variant="outline" size="medium" onClick={onRetry}>
          Try Again
        </AppButton>
      )}
    </div>
  );
};
