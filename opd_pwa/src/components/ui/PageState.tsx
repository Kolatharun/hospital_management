import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState, EmptyStateProps } from './EmptyState';
import { ErrorState, ErrorStateProps } from './ErrorState';

export interface PageStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorProps?: ErrorStateProps;
  emptyProps?: EmptyStateProps;
  skeletonCount?: number;
  children: React.ReactNode;
}

export const PageState: React.FC<PageStateProps> = ({
  isLoading,
  isError,
  isEmpty,
  errorProps,
  emptyProps,
  skeletonCount = 3,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState {...errorProps} />;
  }

  if (isEmpty && emptyProps) {
    return <EmptyState {...emptyProps} />;
  }

  return <>{children}</>;
};
