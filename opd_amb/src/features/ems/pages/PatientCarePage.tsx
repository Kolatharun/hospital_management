import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useAddVitalsMutation, useAddCareEventMutation } from '../api/emsMutations'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { User, Activity, HeartPulse, Pill, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react'

export const PatientCarePage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const addVitalsMutation = useAddVitalsMutation()
  const addCareMutation = useAddCareEventMutation()

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Patient Identity State
  const [patientName, setPatientName] = useState('Ramesh Sharma')
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>('MALE')
  const [patientAge, setPatientAge] = useState('58')
  const [isUnknown, setIsUnknown] = useState(false)

  // Step 2: Clinical Assessment State
  const [primaryImpression, setPrimaryImpression] = useState('Acute Coronary Syndrome (STEMI Suspected)')
  const [allergies, setAllergies] = useState('Penicillin')
  const [pastHistory, setPastHistory] = useState('Hypertension, Type-2 Diabetes')

  // Step 3: Vital Signs State
  const [bpSystolic, setBpSystolic] = useState('154')
  const [bpDiastolic, setBpDiastolic] = useState('96')
  const [pulseBpm, setPulseBpm] = useState('112')
  const [spo2Percent, setSpo2Percent] = useState('98')
  const [gcsTotal, setGcsTotal] = useState('15')
  const [painScale, setPainScale] = useState('9')

  // Step 4: Care Action State
  const [careTitle, setCareTitle] = useState('High-Flow Oxygen Therapy (12L/min)')
  const [careNotes, setCareNotes] = useState('Administered via Non-Rebreather Mask')

  if (isLoading || !mission) return <AppLoadingScreen message="Loading Patient Clinical Interface..." />

  const handleSaveVitals = () => {
    addVitalsMutation.mutate({
      timestamp: new Date().toISOString(),
      bloodPressureSystolic: Number(bpSystolic) || 120,
      bloodPressureDiastolic: Number(bpDiastolic) || 80,
      pulseRateBpm: Number(pulseBpm) || 80,
      spo2Percent: Number(spo2Percent) || 98,
      gcsTotal: Number(gcsTotal) || 15,
      painScale10: Number(painScale) || 5,
    })
  }

  const handleProceedToTransport = () => {
    handleSaveVitals()
    navigate(`/ems/missions/${incidentId}/transport`)
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Light Version Step Navigation Tabs */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-2 grid grid-cols-4 gap-1.5 shadow-xs">
        {[
          { step: 1, label: 'Patient', icon: User },
          { step: 2, label: 'Assessment', icon: Activity },
          { step: 3, label: 'Vitals', icon: HeartPulse },
          { step: 4, label: 'Care Logs', icon: Pill },
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
              <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step 1: Patient Identity */}
      {activeStep === 1 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Patient Identity Record
            </h3>
            <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={isUnknown}
                onChange={(e) => {
                  setIsUnknown(e.target.checked)
                  if (e.target.checked) setPatientName(`UNKNOWN-${Date.now().toString().slice(-4)}`)
                }}
                className="w-4 h-4 rounded text-primary"
              />
              Unknown Identity
            </label>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Full Name / Temp ID</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={isUnknown}
                className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Clinical Assessment */}
      {activeStep === 2 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-3">
            <Activity className="w-4 h-4 text-primary" />
            Clinical Assessment & History
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Primary Clinical Impression</label>
              <input
                type="text"
                value={primaryImpression}
                onChange={(e) => setPrimaryImpression(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Known Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Past Medical History</label>
              <textarea
                value={pastHistory}
                onChange={(e) => setPastHistory(e.target.value)}
                rows={2}
                className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Vital Signs */}
      {activeStep === 3 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-600" />
              Physiological Vital Signs
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Tabular Telematics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
              <label className="font-bold text-on-surface-variant block mb-1">BP Systolic / Diastolic</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  className="w-full h-10 px-2 text-center bg-surface border border-outline-variant rounded-lg font-mono text-base font-extrabold text-on-surface"
                />
                <span className="font-bold text-on-surface-variant">/</span>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  className="w-full h-10 px-2 text-center bg-surface border border-outline-variant rounded-lg font-mono text-base font-extrabold text-on-surface"
                />
              </div>
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
              <label className="font-bold text-on-surface-variant block mb-1">Pulse Rate (BPM)</label>
              <input
                type="number"
                value={pulseBpm}
                onChange={(e) => setPulseBpm(e.target.value)}
                className="w-full h-10 px-2 text-center bg-surface border border-outline-variant rounded-lg font-mono text-base font-extrabold text-red-600"
              />
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
              <label className="font-bold text-on-surface-variant block mb-1">SpO2 Oxygen (%)</label>
              <input
                type="number"
                value={spo2Percent}
                onChange={(e) => setSpo2Percent(e.target.value)}
                className="w-full h-10 px-2 text-center bg-surface border border-outline-variant rounded-lg font-mono text-base font-extrabold text-cyan-600"
              />
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
              <label className="font-bold text-on-surface-variant block mb-1">GCS Total (3-15)</label>
              <input
                type="number"
                value={gcsTotal}
                onChange={(e) => setGcsTotal(e.target.value)}
                className="w-full h-10 px-2 text-center bg-surface border border-outline-variant rounded-lg font-mono text-base font-extrabold text-on-surface"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Care Actions */}
      {activeStep === 4 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-3">
            <Pill className="w-4 h-4 text-purple-600" />
            Care Actions & Medications Administered
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Intervention / Action Title</label>
              <input
                type="text"
                value={careTitle}
                onChange={(e) => setCareTitle(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Dosage & Response Notes</label>
              <textarea
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                rows={2}
                className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Clean Sticky Workflow Action Bar */}
      {activeStep < 4 ? (
        <StickyMissionAction
          label={`Proceed to ${activeStep === 1 ? 'Assessment' : activeStep === 2 ? 'Vitals' : 'Care Logs'}`}
          onClick={() => setActiveStep((activeStep + 1) as any)}
          onBack={activeStep > 1 ? () => setActiveStep((activeStep - 1) as any) : undefined}
          variant="primary"
        />
      ) : (
        <StickyMissionAction
          label="Select Hospital & Transport"
          onClick={handleProceedToTransport}
          onBack={() => setActiveStep(3)}
          variant="emerald"
        />
      )}
    </div>
  )
}
