import React from 'react';
import { WifiOff, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 gap-3 my-4">
    <div className="w-14 h-14 bg-surface-container-low rounded-full flex items-center justify-center text-primary mb-1">
      {icon || <Inbox className="w-7 h-7" />}
    </div>
    <h4 className="font-headline-sm text-on-surface">{title}</h4>
    <p className="font-body-md text-on-surface-variant max-w-xs">{description}</p>
    {actionText && onAction && (
      <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
        {actionText}
      </Button>
    )}
  </div>
);

export interface OfflineStateProps {
  onRetry?: () => void;
}

export const OfflineState: React.FC<OfflineStateProps> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-error-container/20 border border-error/20 rounded-[20px] text-center gap-3 my-4">
    <div className="w-12 h-12 bg-error-container text-on-error-container rounded-full flex items-center justify-center">
      <WifiOff className="w-6 h-6" />
    </div>
    <h4 className="font-headline-sm text-on-surface">You're currently offline</h4>
    <p className="font-body-md text-on-surface-variant max-w-xs">
      Please check your network connection. Cached data will be displayed where available.
    </p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
        Retry Connection
      </Button>
    )}
  </div>
);

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load clinic information. Please try again.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-error/30 rounded-[20px] text-center gap-3 my-4">
    <div className="w-12 h-12 bg-error-container text-on-error-container rounded-full flex items-center justify-center">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h4 className="font-headline-sm text-on-surface">{title}</h4>
    <p className="font-body-md text-on-surface-variant max-w-xs">{message}</p>
    {onRetry && (
      <Button variant="primary" size="sm" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
        Try Again
      </Button>
    )}
  </div>
);
