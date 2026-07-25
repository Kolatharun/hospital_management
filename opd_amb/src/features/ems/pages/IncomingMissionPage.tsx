import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useAcknowledgeMissionMutation, useDeclineMissionMutation } from '../api/emsMutations'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { AlertCircle, Phone, MapPin, Navigation, Clock, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react'

export const IncomingMissionPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const acknowledgeMutation = useAcknowledgeMissionMutation()
  const declineMutation = useDeclineMissionMutation()

  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  if (isLoading || !mission) return <AppLoadingScreen message="Receiving Dispatch Telemetry..." />

  const incident = mission.incident

  const handleAccept = () => {
    acknowledgeMutation.mutate(incident.id, {
      onSuccess: () => {
        navigate(`/ems/missions/${incident.id}`)
      },
    })
  }

  const handleDeclineSubmit = () => {
    if (!declineReason) return
    declineMutation.mutate(declineReason, {
      onSuccess: () => {
        setDeclineOpen(false)
        navigate('/ems')
      },
    })
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Priority Banner Header */}
      <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black bg-white/25 px-2.5 py-0.5 rounded tracking-widest uppercase">
            PRIORITY {incident.priorityCode} EMERGENCY ALERT
          </span>
          <span className="text-xs font-mono font-bold flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            LIVE DISPATCH
          </span>
        </div>

        <h1 className="text-2xl font-black leading-tight tracking-tight font-headline">{incident.chiefComplaint}</h1>

        <div className="flex items-center gap-4 text-xs font-semibold pt-2.5 border-t border-white/20">
          <span>Patient: {incident.patientAgeGender || 'Age/Gender Unknown'}</span>
          <span>ETA Drive: {incident.estimatedDriveMinutes} mins ({incident.estimatedDistanceKm} km)</span>
        </div>
      </div>

      {/* Incident Location & Access */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          Scene Location & Access Instructions
        </h3>

        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60 space-y-1">
          <p className="text-sm font-bold text-on-surface">{incident.location.address}</p>
          {incident.location.landmark && (
            <p className="text-xs text-on-surface-variant font-medium">Landmark: {incident.location.landmark}</p>
          )}
          {incident.location.accessInstructions && (
            <p className="text-xs text-amber-800 font-semibold pt-1.5 border-t border-outline-variant/40 mt-1.5">
              Instructions: {incident.location.accessInstructions}
            </p>
          )}
        </div>

        {incident.dispatcherNotes && (
          <div className="bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-xl text-xs space-y-1">
            <p className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
              Dispatcher Critical Notes
            </p>
            <p className="text-blue-950 font-medium leading-relaxed">{incident.dispatcherNotes}</p>
          </div>
        )}
      </div>

      {/* Caller Contact Info */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
        <div className="min-w-0">
          <p className="text-xs text-on-surface-variant font-medium">Reporting Party / Caller</p>
          <p className="text-sm font-bold text-on-surface truncate">{incident.callerName}</p>
          <p className="text-xs font-mono font-semibold text-on-surface-variant">{incident.callerPhone}</p>
        </div>
        <a
          href={`tel:${incident.callerPhone}`}
          className="px-4 py-2.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all font-bold text-xs flex items-center gap-2 shrink-0 active:scale-95 min-h-[48px]"
        >
          <Phone className="w-4 h-4" />
          Call Caller
        </a>
      </div>

      {/* Workflow Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={acknowledgeMutation.isPending}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          {acknowledgeMutation.isPending ? 'Accepting Mission...' : 'Accept Mission & Start En-Route'}
        </button>

        <button
          type="button"
          onClick={() => setDeclineOpen(true)}
          className="w-full h-12 bg-surface-container border border-red-500/30 text-red-600 hover:bg-red-500/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <XCircle className="w-4 h-4" />
          Unable to Respond
        </button>
      </div>

      {/* Decline Reason Modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-4 space-y-4 text-on-surface shadow-2xl">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Reason Required: Unable to Respond
            </h3>

            <p className="text-xs text-on-surface-variant">
              Select or specify a mandatory reason why your ambulance unit cannot accept this mission:
            </p>

            <div className="space-y-2">
              {[
                'Vehicle mechanical fault or breakdown',
                'Crew engaged in critical active patient transfer',
                'Severe traffic obstruction / route blocked',
                'Oxygen / essential life support equipment exhausted',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDeclineReason(reason)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                    declineReason === reason
                      ? 'bg-red-500/10 border-red-500 text-red-700'
                      : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-outline'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineOpen(false)}
                className="flex-1 h-11 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={!declineReason || declineMutation.isPending}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Submit & Reject Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
