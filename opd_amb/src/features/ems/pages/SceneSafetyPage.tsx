import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useSaveSceneSafetyMutation } from '../api/emsMutations'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { ShieldCheck, ShieldAlert, AlertOctagon, UserCheck, UserX, Users, Flame, Siren, PhoneCall } from 'lucide-react'

export const SceneSafetyPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const saveSceneSafetyMutation = useSaveSceneSafetyMutation()

  const [safetyStatus, setSafetyStatus] = useState<'SAFE' | 'UNSAFE' | 'NOT_SURE'>('SAFE')
  const [patientFound, setPatientFound] = useState<boolean>(true)
  const [selectedHazards, setSelectedHazards] = useState<string[]>([])
  const [backupRequested, setBackupRequested] = useState<string | null>(null)

  if (isLoading || !mission) return <AppLoadingScreen message="Assessing Scene Safety Protocols..." />

  const incident = mission.incident

  const toggleHazard = (hazard: string) => {
    setSelectedHazards((prev) =>
      prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard]
    )
  }

  const handleRequestAssistance = (type: string) => {
    setBackupRequested(type)
    alert(`DISPATCH ALERT SENT: Requesting emergency backup (${type}) to scene!`)
  }

  const handleProceedCare = () => {
    const isSafe = safetyStatus === 'SAFE'
    saveSceneSafetyMutation.mutate(
      { safe: isSafe, hazards: selectedHazards },
      {
        onSuccess: () => {
          if (isSafe && patientFound) {
            navigate(`/ems/missions/${incident.id}/care`)
          }
        },
      }
    )
  }

  const isActionDisabled = safetyStatus !== 'SAFE' || !patientFound

  const getDisabledReason = () => {
    if (safetyStatus === 'UNSAFE') return 'Cannot proceed: Scene is marked UNSAFE. Stand by for police.'
    if (safetyStatus === 'NOT_SURE') return 'Please confirm scene safety protocol.'
    if (!patientFound) return 'Patient unlocated on scene. Report status to dispatch.'
    return undefined
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Scene Header */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-2 shadow-xs">
        <span className="text-[11px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/30 px-2.5 py-0.5 rounded tracking-wide uppercase">
          ON SCENE ASSESSMENT
        </span>
        <h1 className="text-xl font-black text-on-surface font-headline leading-tight">{incident.chiefComplaint}</h1>
        <p className="text-xs text-on-surface-variant font-medium">{incident.location.address}</p>
      </div>

      {/* Scene Safety Selection Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          1. Scene Safety & Hazard Protocol
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSafetyStatus('SAFE')}
            className={`p-3 min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold active:scale-95 ${
              safetyStatus === 'SAFE'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 shadow-2xs'
                : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Scene Safe</span>
          </button>

          <button
            type="button"
            onClick={() => setSafetyStatus('NOT_SURE')}
            className={`p-3 min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold active:scale-95 ${
              safetyStatus === 'NOT_SURE'
                ? 'bg-amber-500/10 border-amber-500 text-amber-700 shadow-2xs'
                : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Caution / Unsure</span>
          </button>

          <button
            type="button"
            onClick={() => setSafetyStatus('UNSAFE')}
            className={`p-3 min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold active:scale-95 ${
              safetyStatus === 'UNSAFE'
                ? 'bg-red-500/10 border-red-500 text-red-700 shadow-2xs'
                : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
            }`}
          >
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            <span>Scene Unsafe</span>
          </button>
        </div>

        {/* Hazard Selectors */}
        {safetyStatus !== 'SAFE' && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-bold text-on-surface-variant">Report Environmental Hazards:</p>
            <div className="flex flex-wrap gap-2">
              {['Hostile Bystanders', 'Fire / Smoke Hazard', 'Chemical / Gas Leak', 'Traffic Threat', 'Structural Collapse'].map(
                (hazard) => {
                  const active = selectedHazards.includes(hazard)
                  return (
                    <button
                      key={hazard}
                      type="button"
                      onClick={() => toggleHazard(hazard)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all active:scale-95 ${
                        active
                          ? 'bg-red-500/20 border-red-500 text-red-700 font-bold'
                          : 'bg-surface-container border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      {hazard}
                    </button>
                  )
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Backup Selector Grid */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <Siren className="w-4 h-4 text-red-600 shrink-0" />
          Request Immediate Emergency Backup
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleRequestAssistance('Police Force')}
            className="p-3 min-h-[56px] bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-800 font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-blue-500/20 transition-all active:scale-95"
          >
            <Siren className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Police</span>
          </button>

          <button
            type="button"
            onClick={() => handleRequestAssistance('Fire Rescue')}
            className="p-3 min-h-[56px] bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-800 font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-orange-500/20 transition-all active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Fire Dept</span>
          </button>

          <button
            type="button"
            onClick={() => handleRequestAssistance('Additional ALS Unit')}
            className="p-3 min-h-[56px] bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-800 font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-purple-500/20 transition-all active:scale-95"
          >
            <Users className="w-4 h-4 text-purple-600 shrink-0" />
            <span>ALS Backup</span>
          </button>
        </div>
      </div>

      {/* Patient Located Confirmation */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <UserCheck className="w-4 h-4 text-primary shrink-0" />
          2. Patient Contact Verification
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPatientFound(true)}
            className={`p-3 min-h-[48px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
              patientFound
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 shadow-2xs'
                : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Patient Found</span>
          </button>

          <button
            type="button"
            onClick={() => setPatientFound(false)}
            className={`p-3 min-h-[48px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
              !patientFound
                ? 'bg-red-500/10 border-red-500 text-red-700 shadow-2xs'
                : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
            }`}
          >
            <UserX className="w-4 h-4 text-red-600 shrink-0" />
            <span>Unable to Locate</span>
          </button>
        </div>
      </div>

      {/* Workflow Action Button */}
      <StickyMissionAction
        label="Begin Patient Assessment & Care"
        onClick={handleProceedCare}
        onBack={() => navigate(`/ems/missions/${incidentId}`)}
        disabled={isActionDisabled}
        disabledReason={getDisabledReason()}
        loading={saveSceneSafetyMutation.isPending}
        variant="emerald"
      />
    </div>
  )
}
