import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useConfirmArrivalMutation, useDeclineMissionMutation } from '../api/emsMutations'
import { MissionMap } from '../components/MissionMap'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { Phone, AlertTriangle, ShieldCheck, MapPin, Compass, Navigation, Clock } from 'lucide-react'

export const MissionNavigationPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const confirmArrivalMutation = useConfirmArrivalMutation()
  const declineMutation = useDeclineMissionMutation()

  const [delayModalOpen, setDelayModalOpen] = useState(false)
  const [delayReason, setDelayReason] = useState('')

  if (isLoading || !mission) return <AppLoadingScreen message="Loading Navigation Telematics..." />

  const incident = mission.incident

  const handleArrived = () => {
    confirmArrivalMutation.mutate(undefined, {
      onSuccess: () => {
        navigate(`/ems/missions/${incident.id}/scene`)
      },
    })
  }

  const handleReportDelay = () => {
    if (!delayReason) return
    alert(`Traffic delay reported to dispatch: ${delayReason}`)
    setDelayModalOpen(false)
    setDelayReason('')
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Route Navigation Header */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-black bg-cyan-500/10 text-cyan-700 border border-cyan-500/30 px-2.5 py-0.5 rounded tracking-wide uppercase shrink-0">
              EN ROUTE TO SCENE
            </span>
            <span className="text-xs font-bold text-on-surface truncate">ETA: {incident.estimatedDriveMinutes} mins</span>
          </div>
          <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded shrink-0 border border-outline-variant/40">
            {incident.estimatedDistanceKm} km
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black text-on-surface font-headline leading-tight">{incident.chiefComplaint}</h2>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{incident.location.address}</span>
          </p>
        </div>
      </div>

      {/* Embedded Google Map Component */}
      <MissionMap
        location={incident.location}
        targetName={`Scene: ${incident.chiefComplaint}`}
        estimatedMinutes={incident.estimatedDriveMinutes}
        distanceKm={incident.estimatedDistanceKm}
      />

      {/* Quick Action Dial Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${incident.callerPhone}`}
          className="p-3 bg-surface border border-outline-variant rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30 transition-all active:scale-[0.98] min-h-[48px] shadow-2xs"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span className="truncate">Call ({incident.callerName})</span>
        </a>

        <button
          type="button"
          onClick={() => setDelayModalOpen(true)}
          className="p-3 bg-surface border border-outline-variant rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-700 hover:bg-amber-500/10 border-amber-500/30 transition-all active:scale-[0.98] min-h-[48px] shadow-2xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Report Delay</span>
        </button>
      </div>

      {/* Sticky Primary Action: Arrived On Scene */}
      <StickyMissionAction
        label="Confirm Arrival On Scene"
        onClick={handleArrived}
        onBack={() => navigate(`/ems/missions/${incidentId}/alert`)}
        loading={confirmArrivalMutation.isPending}
        variant="amber"
      />

      {/* Delay Report Modal */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-4 space-y-4 text-on-surface shadow-2xl">
            <h3 className="text-base font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Report Route Delay to Dispatch
            </h3>

            <div className="space-y-2">
              {['Heavy traffic congestion', 'Road construction / detour', 'Severe weather condition', 'Vehicle slow progress'].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDelayReason(reason)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                      delayReason === reason
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700'
                        : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
                    }`}
                  >
                    {reason}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDelayModalOpen(false)}
                className="flex-1 h-11 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportDelay}
                disabled={!delayReason}
                className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-50"
              >
                Send Telemetry Delay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
