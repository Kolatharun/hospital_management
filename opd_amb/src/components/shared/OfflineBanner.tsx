import React from 'react'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/features/ems/hooks/useOnlineStatus'
import { useEMSUiStore } from '@/features/ems/state/emsUiStore'

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus()
  const offlineSimulated = useEMSUiStore((state) => state.offlineSimulated)

  const showBanner = !isOnline || offlineSimulated

  if (!showBanner) return null

  return (
    <div className="bg-primary-container text-on-primary-container px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md relative z-[60]">
      <WifiOff className="w-4 h-4" />
      <span>
        {offlineSimulated
          ? 'OFFLINE DEMO MODE — Actions will be queued in Secure Encrypted Storage'
          : 'NETWORK DISCONNECTED — Operating in Offline Mode. Records queued for sync.'}
      </span>
    </div>
  )
}
