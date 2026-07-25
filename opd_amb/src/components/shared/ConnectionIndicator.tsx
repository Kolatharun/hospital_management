import React from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/features/ems/hooks/useOnlineStatus'

export const ConnectionIndicator: React.FC = () => {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant">
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-primary" />
          <span className="text-on-surface-variant font-medium text-[11px]">ONLINE</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <WifiOff className="w-3.5 h-3.5 text-secondary" />
          <span className="text-secondary font-medium text-[11px]">OFFLINE</span>
        </>
      )}
    </div>
  )
}
