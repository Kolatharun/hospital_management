import React from 'react'
import { Activity } from 'lucide-react'

export const AppLoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Initializing Balaji EMS Responder...',
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary-container/30 flex items-center justify-center text-primary">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <h3 className="text-on-surface font-semibold text-base tracking-wide font-headline">{message}</h3>
      <p className="text-on-surface-variant text-xs mt-2">Connecting to Balaji Emergency Dispatch Network...</p>
    </div>
  )
}
