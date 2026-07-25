import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShiftQuery } from '../api/emsQueries'
import { useStartShiftMutation } from '../api/emsMutations'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { useActiveMission } from '../hooks/useActiveMission'
import { CheckCircle2, AlertTriangle, PhoneCall, ShieldAlert, ShieldCheck, MapPin, Truck, Radio } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { id: 'oxygen', label: 'Oxygen pressure > 1800 PSI', category: 'Medical' },
  { id: 'defib', label: 'Defibrillator battery fully charged (100%)', category: 'Medical' },
  { id: 'stretcher', label: 'Stretcher locking mechanism functional', category: 'Hardware' },
  { id: 'medkit', label: 'First Aid & Trauma Kit stocked & verified', category: 'Medical' },
  { id: 'fuel', label: 'Fuel level > 80% & engine fluids checked', category: 'Vehicle' },
  { id: 'suction', label: 'Suction unit operational', category: 'Hardware' },
]

export const ShiftHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: shift, isLoading } = useShiftQuery()
  const { mission, hasActiveMission } = useActiveMission()
  const startShiftMutation = useStartShiftMutation()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [isLive, setIsLive] = useState(false)

  if (isLoading) return <AppLoadingScreen message="Checking Duty Dashboard..." />

  const checkedCount = Object.values(checked).filter(Boolean).length
  const allChecked = checkedCount === CHECKLIST_ITEMS.length

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleGoLive = () => {
    if (!allChecked) return
    startShiftMutation.mutate(
      {
        oxygenPressurePsi: 2000,
        defibrillatorBatteryPercent: 100,
        stretcherFunctional: true,
        firstAidKitStocked: true,
        fuelLevelPercent: 92,
        suctionFunctional: true,
        medicationsChecked: true,
      },
      {
        onSuccess: () => {
          setIsLive(true)
        },
      }
    )
  }

  const crewName = shift?.crew.lead.name ?? 'Responder'

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Greeting & Duty Badge */}
      <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-on-surface-variant font-medium">On-Duty Paramedic Lead</p>
            <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">{crewName}</h1>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isLive ? 'AMBULANCE AVAILABLE' : 'READINESS CHECK REQUIRED'}
          </span>
        </div>

        <div className="flex items-center gap-4 pt-2.5 border-t border-outline-variant/60 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-semibold">
            <Truck className="w-4 h-4 text-primary shrink-0" />
            <span>{shift?.ambulance.callSign ?? 'BALAJI-ALPHA-1'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>{shift?.crew.stationName ?? 'Central Station'}</span>
          </div>
        </div>
      </div>

      {/* Active Mission Alert Banner */}
      {hasActiveMission && mission && (
        <div
          onClick={() => navigate(`/ems/missions/${mission.incident.id}/alert`)}
          className="bg-red-500/10 border-2 border-red-500/40 p-4 rounded-2xl cursor-pointer hover:bg-red-500/15 transition-all shadow-md space-y-2 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-red-600 bg-red-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
              INCOMING EMERGENCY MISSION
            </span>
            <span className="text-xs font-bold text-red-700 shrink-0">Tap to Respond →</span>
          </div>
          <h3 className="text-base font-bold text-on-surface leading-tight">{mission.incident.chiefComplaint}</h3>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{mission.incident.location.address}</span>
          </p>
        </div>
      )}

      {/* Ambulance Readiness Checklist */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-on-surface font-headline">Vehicle Readiness Checklist</h2>
            <p className="text-xs text-on-surface-variant font-medium">Mandatory verification before marking unit available</p>
          </div>
          <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 shrink-0">
            {checkedCount} / {CHECKLIST_ITEMS.length}
          </span>
        </div>

        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = Boolean(checked[item.id])
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`w-full min-h-[52px] flex items-center justify-between p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-on-surface font-medium shadow-2xs'
                    : 'bg-surface-container-low border-outline-variant/70 text-on-surface-variant hover:border-outline'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-outline-variant bg-surface'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold leading-tight">{item.label}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-surface-container text-on-surface-variant px-2 py-0.5 rounded shrink-0 border border-outline-variant/40">
                  {item.category}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleGoLive}
          disabled={!allChecked || isLive}
          className={`w-full h-14 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
            isLive
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-900/10'
              : allChecked
              ? 'bg-primary text-on-primary hover:bg-primary/90'
              : 'bg-surface-container-high text-on-surface-variant/60 border border-outline-variant cursor-not-allowed'
          }`}
        >
          {isLive ? (
            <>
              <ShieldCheck className="w-5 h-5" />
              Ambulance Marked Available for Mission Dispatch
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5" />
              {allChecked ? 'Mark Ambulance Available' : `Complete All ${CHECKLIST_ITEMS.length - checkedCount} Checks First`}
            </>
          )}
        </button>
      </div>

      {/* Quick Action Operations Grid */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="tel:108"
          className="p-4 bg-surface border border-outline-variant rounded-xl flex items-center gap-3 hover:border-primary transition-all active:scale-[0.98] shadow-xs min-h-[64px]"
        >
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">Call Dispatch</p>
            <p className="text-[11px] text-on-surface-variant font-mono">Hotline 108</p>
          </div>
        </a>

        <button
          type="button"
          onClick={() => alert('Vehicle issue ticket created for Dispatch Maintenance Desk.')}
          className="p-4 bg-surface border border-outline-variant rounded-xl flex items-center gap-3 hover:border-amber-500 transition-all text-left active:scale-[0.98] shadow-xs min-h-[64px]"
        >
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">Report Issue</p>
            <p className="text-[11px] text-on-surface-variant truncate">Vehicle/Equipment</p>
          </div>
        </button>
      </div>
    </div>
  )
}
