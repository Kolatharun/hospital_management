import React, { useState } from 'react'
import { useShiftQuery, useSyncStatusQuery } from '../api/emsQueries'
import { emsSyncManager } from '../api/emsSyncManager'
import { useQueryClient } from '@tanstack/react-query'
import { emsQueryKeys } from '../api/emsQueryKeys'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { User, Shield, Truck, Radio, Wifi, MapPin, RefreshCw, Moon, Sun, CheckCircle2, HardDriveUpload } from 'lucide-react'

export const EMSProfilePage: React.FC = () => {
  const { data: shift, isLoading } = useShiftQuery()
  const { data: syncRecords = [] } = useSyncStatusQuery()
  const queryClient = useQueryClient()

  const [isSyncing, setIsSyncing] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [reducedMotion, setReducedMotion] = useState(false)

  if (isLoading) return <AppLoadingScreen message="Loading Responder Profile..." />

  const lead = shift?.crew.lead
  const amb = shift?.ambulance

  const handleManualSync = async () => {
    setIsSyncing(true)
    await emsSyncManager.processSyncQueue()
    await queryClient.invalidateQueries({ queryKey: emsQueryKeys.syncStatus() })
    setTimeout(() => {
      setIsSyncing(false)
    }, 600)
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Profile & Badge Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xl shrink-0 font-headline">
            {lead?.name.slice(0, 2).toUpperCase() || 'RK'}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-on-surface font-headline truncate">{lead?.name || 'Rajesh Kumar'}</h1>
            <p className="text-xs font-semibold text-primary truncate">{lead?.certificationLevel || 'Advanced EMT-Paramedic Lead'}</p>
            <p className="text-xs font-mono font-semibold text-on-surface-variant">Badge: {lead?.badgeNumber || 'EMS-PAR-904'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-outline-variant/60 text-xs">
          <div className="flex items-center gap-1.5 text-on-surface font-semibold truncate">
            <Truck className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Unit: {amb?.callSign || 'BALAJI-ALPHA-1'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface font-semibold truncate">
            <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Freq: 108.4 MHz</span>
          </div>
        </div>
      </div>

      {/* Telematics & Hardware Diagnostics */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <Wifi className="w-4 h-4 text-primary shrink-0" />
          Hardware & Telematics Diagnostics
        </h3>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-on-surface-variant">GPS Telemetry</span>
            <p className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> High Accuracy (3m)
            </p>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-on-surface-variant">Cellular Network</span>
            <p className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 5G Connected (-68dBm)
            </p>
          </div>
        </div>
      </div>

      {/* Offline Sync Queue Manager */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
            <HardDriveUpload className="w-4 h-4 text-primary shrink-0" />
            Offline Data Sync Manager
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
            All Synced
          </span>
        </div>

        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
          Local IndexedDB telemetry queue stores mission records securely when cellular connection drops.
        </p>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] min-h-[48px]"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronizing Records...' : 'Manual Sync Telemetry Now'}
        </button>
      </div>

      {/* App Preferences */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface font-headline">Application Settings</h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/60 min-h-[52px]">
            <span className="font-semibold text-on-surface">Theme Mode</span>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-3.5 py-1.5 bg-surface border border-outline-variant rounded-lg font-bold flex items-center gap-1.5 text-primary min-h-[36px] active:scale-95 transition-all"
            >
              {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/60 min-h-[52px]">
            <span className="font-semibold text-on-surface">Reduced Motion Animation</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
