import React from 'react'
import { Outlet } from 'react-router-dom'
import { EMSHeader } from './EMSHeader'
import { EMSBottomNavigation } from './EMSBottomNavigation'
import { ActiveMissionCard } from './ActiveMissionCard'
import { CrewHelpSheet } from './CrewHelpSheet'
import { DevStateSwitcher } from './DevStateSwitcher'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { ConnectionIndicator } from '@/components/shared/ConnectionIndicator'
import { useActiveMissionQuery } from '../api/emsQueries'
import { isActiveMission } from '../utils/missionStatus'

export const EMSAppShell: React.FC = () => {
  const { data: activeMission } = useActiveMissionQuery()

  const hasActiveMission = Boolean(activeMission && isActiveMission(activeMission.status))

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body max-w-[480px] mx-auto relative shadow-2xl overflow-x-hidden border-x border-outline-variant/40">
      {/* Top Header & Connection Bar */}
      <EMSHeader />

      {/* Global Offline Status Banner */}
      <div className="pt-[56px]">
        <OfflineBanner />
      </div>

      {/* Persistent Active Mission Telemetry Strip */}
      {hasActiveMission && activeMission && (
        <ActiveMissionCard mission={activeMission} />
      )}

      {/* Main Screen Content Area */}
      <main className="flex-1 flex flex-col pb-[72px] pt-1">
        <Outlet />
      </main>

      {/* Shared Bottom Navigation */}
      <EMSBottomNavigation />

      {/* Shared Emergency Crew Help Sheet */}
      <CrewHelpSheet />

      {/* Dev-only Mission State Switcher */}
      <DevStateSwitcher />
    </div>
  )
}
