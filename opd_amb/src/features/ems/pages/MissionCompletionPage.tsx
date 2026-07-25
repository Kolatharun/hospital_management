import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useCompleteMissionMutation } from '../api/emsMutations'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { CheckCircle2, RefreshCw, ShieldCheck, Sparkles, AlertTriangle, FileCheck } from 'lucide-react'

const RESET_CHECKLIST = [
  { id: 'clean', label: 'Ambulance interior sanitized & disinfected', required: true },
  { id: 'oxygen', label: 'Main oxygen cylinder pressure checked & refilled', required: true },
  { id: 'restock', label: 'Trauma & medication kit restocked', required: true },
  { id: 'stretcher', label: 'Stretcher cleaned & linen replaced', required: true },
]

export const MissionCompletionPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const completeMissionMutation = useCompleteMissionMutation()

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [outcome, setOutcome] = useState<'PATIENT_DELIVERED' | 'PATIENT_REFUSED' | 'PATIENT_DECEASED' | 'CANCELLED_EN_ROUTE' | 'NO_PATIENT_LOCATED'>('PATIENT_DELIVERED')
  const [resetChecked, setResetChecked] = useState<string[]>(['clean', 'oxygen', 'restock', 'stretcher'])
  const [summaryNotes, setSummaryNotes] = useState('Mission completed without complications. Patient delivered safely to ER.')

  if (isLoading || !mission) return <AppLoadingScreen message="Loading Reset & Completion Logs..." />

  const toggleResetItem = (id: string) => {
    setResetChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const allResetPassed = RESET_CHECKLIST.every((i) => resetChecked.includes(i.id))

  const handleFinalComplete = () => {
    completeMissionMutation.mutate(
      {
        completedAt: new Date().toISOString(),
        totalDistanceKm: 12.4,
        outcome,
        summaryNotes,
        vehicleCleanedAndRestocked: allResetPassed,
      },
      {
        onSuccess: () => {
          navigate('/ems')
        },
      }
    )
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Refined Step Navigation Bar */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-2 grid grid-cols-3 gap-1.5 shadow-xs">
        {[
          { step: 1, label: '1. Outcome', icon: FileCheck },
          { step: 2, label: '2. Reset Unit', icon: RefreshCw },
          { step: 3, label: '3. Sign-Off', icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon
          const isActive = activeStep === item.step
          const isDone = activeStep > item.step
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step as any)}
              className={`py-2 px-1 min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs active:scale-95 ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-2xs'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/30'
                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/70 hover:bg-surface-container'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight truncate">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step 1: Mission Outcome */}
      {activeStep === 1 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3 shadow-xs">
          <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/60 pb-3">
            Select Mission Disposition / Outcome
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { id: 'PATIENT_DELIVERED', label: 'Patient Delivered to Hospital', desc: 'Successful transport & handover completed' },
              { id: 'PATIENT_REFUSED', label: 'Patient Refused Care / Transport', desc: 'Refusal form signed on scene' },
              { id: 'TREATED_ON_SCENE', label: 'Treated On Scene & Released', desc: 'No hospital transport required' },
              { id: 'CANCELLED_EN_ROUTE', label: 'Cancelled En Route by Dispatch', desc: 'Unit recalled before scene arrival' },
            ].map((item) => {
              const isSelected = outcome === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOutcome(item.id as any)
                    setActiveStep(2)
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-on-surface-variant/70'}`}>
                    {item.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Ambulance Reset & Decontamination */}
      {activeStep === 2 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              Ambulance Reset & Sanitation Checklist
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {resetChecked.length} / {RESET_CHECKLIST.length} Verified
            </span>
          </div>

          <div className="space-y-2">
            {RESET_CHECKLIST.map((item) => {
              const isChecked = resetChecked.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleResetItem(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-on-surface'
                      : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'
                  }`}
                >
                  <span>{item.label}</span>
                  <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-emerald-600' : 'text-outline-variant'}`} />
                </button>
              )
            })}
          </div>

          <StickyMissionAction
            label="Proceed to Final Review"
            onClick={() => setActiveStep(3)}
            onBack={() => setActiveStep(1)}
            disabled={!allResetPassed}
            disabledReason={!allResetPassed ? 'Complete all ambulance reset checklist items' : undefined}
            variant="primary"
          />
        </div>
      )}

      {/* Step 3: Final Review & Complete Mission */}
      {activeStep === 3 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-1">
            <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ready to Complete Mission & Reset Ambulance Status
            </p>
            <p className="text-xs text-on-surface-variant">
              Disposition: <span className="font-bold text-on-surface">{outcome.replace(/_/g, ' ')}</span>
            </p>
          </div>

          <div>
            <label className="font-bold text-xs text-on-surface-variant block mb-1">Final Mission Summary Remarks</label>
            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              rows={3}
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <StickyMissionAction
            label="Complete Mission & Mark Available"
            onClick={handleFinalComplete}
            onBack={() => setActiveStep(2)}
            disabled={!allResetPassed}
            disabledReason={!allResetPassed ? 'Complete all ambulance reset checklist items' : undefined}
            loading={completeMissionMutation.isPending}
            variant="emerald"
          />
        </div>
      )}
    </div>
  )
}
