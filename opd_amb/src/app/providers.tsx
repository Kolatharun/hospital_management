import React, { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { AppErrorBoundary } from '@/components/shared/AppErrorBoundary'

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
