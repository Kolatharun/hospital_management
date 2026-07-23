import React from 'react';
import { clsx } from 'clsx';

export interface ScreenContainerProps {
  children: React.ReactNode;
  hasBottomNav?: boolean;
  className?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  hasBottomNav = true,
  className,
}) => {
  return (
    <main
      className={clsx(
        'flex-1 px-4 py-4 w-full flex flex-col',
        hasBottomNav ? 'pb-24' : 'pb-6',
        className
      )}
    >
      {children}
    </main>
  );
};
