import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery, useHospitalsQuery } from '../api/emsQueries'
import { useSelectHospitalPreAlertMutation, useConfirmArrivalMutation } from '../api/emsMutations'
import { HospitalCard } from '../components/HospitalCard'
import { MissionMap } from '../components/MissionMap'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { Hospital as HospitalIcon, Send, Navigation, Phone, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

export const HospitalTransportPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading: missionLoading } = useActiveMissionQuery()
  const { data: hospitals = [], isLoading: hospitalsLoading } = useHospitalsQuery()
  const selectHospitalMutation = useSelectHospitalPreAlertMutation()
  const confirmArrivalMutation = useConfirmArrivalMutation()

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-01')
  const [specialNeeds, setSelectedSpecialNeeds] = useState<string[]>(['STEMI Cath Lab Prep', 'High-Flow O2 Onboard'])
  const [preAlertSent, setPreAlertSent] = useState(false)

  if (missionLoading || hospitalsLoading || !mission)
    return <AppLoadingScreen message="Loading Hospital Emergency Telemetry..." />

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0]

  const toggleSpecialNeed = (need: string) => {
    setSelectedSpecialNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    )
  }

  const handleSendPreAlert = () => {
    selectHospitalMutation.mutate(
      { hospitalId: selectedHospitalId, specialNeeds },
      {
        onSuccess: () => {
          setPreAlertSent(true)
          setActiveStep(3)
        },
      }
    )
  }

  const handleArrivedAtHospital = () => {
    navigate(`/ems/missions/${incidentId}/handover`)
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Refined 3-Step Wizard Indicator */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-2 grid grid-cols-3 gap-1.5 shadow-xs">
        {[
          { step: 1, label: '1. Select ER', icon: HospitalIcon },
          { step: 2, label: '2. Pre-Alert', icon: Send },
          { step: 3, label: '3. En Route', icon: Navigation },
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

      {/* Step 1: Select Hospital with Google Maps Location Embeds */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">Receiving Emergency Hospitals</h2>
            <span className="text-xs text-on-surface-variant">Live Bed Availability</span>
          </div>

          <div className="space-y-3">
            {hospitals.map((hosp) => (
              <HospitalCard
                key={hosp.id}
                hospital={hosp}
                isSelected={hosp.id === selectedHospitalId}
                onSelect={(h) => {
                  setSelectedHospitalId(h.id)
                  setActiveStep(2)
                }}
                showMapEmbed={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Hospital Pre-Alert Dispatch */}
      {activeStep === 2 && selectedHospital && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Pre-Alert Telemetry Preview
              </span>
              <h2 className="text-lg font-black text-on-surface mt-1">{selectedHospital.name}</h2>
            </div>
            <span className="text-sm font-extrabold text-primary">{selectedHospital.driveMinutes} min ETA</span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 text-xs space-y-1.5">
            <p className="font-bold text-on-surface">Patient Complaint: {mission.incident.chiefComplaint}</p>
            <p className="text-on-surface-variant">
              Triage Level: <span className="text-red-600 font-bold">RED (High Priority STEMI)</span>
            </p>
            <p className="text-on-surface-variant">Vitals: BP 154/96 | Pulse 112 BPM | SpO2 98%</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface block">Special Needs / ER Requirements:</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'STEMI Cath Lab Prep',
                'High-Flow O2 Onboard',
                'Trauma Bay Standby',
                'Ventilator Ready',
                'Blood Transfusion Standby',
              ].map((need) => {
                const active = specialNeeds.includes(need)
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleSpecialNeed(need)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {need}
                  </button>
                )
              })}
            </div>
          </div>

          <StickyMissionAction
            label="Transmit Pre-Alert to ER Desk"
            onClick={handleSendPreAlert}
            onBack={() => setActiveStep(1)}
            loading={selectHospitalMutation.isPending}
            variant="emerald"
          />
        </div>
      )}

      {/* Step 3: Transporting & Turn-by-Turn Navigation */}
      {activeStep === 3 && selectedHospital && (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Hospital Pre-Alert Acknowledged & Bed Reserved
              </span>
              <span className="text-xs font-mono font-bold text-primary">{selectedHospital.driveMinutes} min ETA</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">{selectedHospital.name}</h3>
            <p className="text-xs text-on-surface-variant">{selectedHospital.address}</p>
          </div>

          {/* Interactive Google Map to Hospital */}
          <MissionMap
            location={{
              address: selectedHospital.address,
              city: 'Mumbai',
              latitude: selectedHospital.latitude || 19.0825,
              longitude: selectedHospital.longitude || 72.8800,
            }}
            targetName={selectedHospital.name}
            estimatedMinutes={selectedHospital.driveMinutes}
            distanceKm={selectedHospital.distanceKm}
          />

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${selectedHospital.phone}`}
              className="p-3 bg-surface border border-outline-variant rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Hospital ER
            </a>

            <button
              type="button"
              onClick={() => alert('Patient condition change logged & broadcasted to receiving ER.')}
              className="p-3 bg-surface border border-outline-variant rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-600 hover:bg-amber-500/10 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Log Patient Change
            </button>
          </div>

          <StickyMissionAction
            label="Arrived at Hospital Handover"
            onClick={handleArrivedAtHospital}
            onBack={() => setActiveStep(2)}
            variant="emerald"
          />
        </div>
      )}
    </div>
  )
}
