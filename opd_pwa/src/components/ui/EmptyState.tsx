import React from 'react';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[18px] border border-[#DCE6E7] my-4">
      {icon && <div className="p-4 mb-3 rounded-full bg-[#DFF3F5] text-[#0B6875]">{icon}</div>}
      <h3 className="text-base font-bold text-[#16343C] mb-1">{title}</h3>
      <p className="text-xs text-[#708188] max-w-xs mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <AppButton size="medium" onClick={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
};
