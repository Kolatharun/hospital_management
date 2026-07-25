import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveMissionQuery } from '../api/emsQueries'
import { useCompleteHandoverMutation } from '../api/emsMutations'
import { HandoverChecklist } from '../components/HandoverChecklist'
import { StickyMissionAction } from '../components/StickyMissionAction'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { ClipboardCheck, UserCheck, ShieldCheck, FileText, PenTool } from 'lucide-react'

export const HandoverPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading } = useActiveMissionQuery()
  const completeHandoverMutation = useCompleteHandoverMutation()

  const [doctorName, setDoctorName] = useState('Dr. Ananya Roy')
  const [nurseName, setNurseName] = useState('Nurse Priya Nair')
  const [docRegNo, setDocRegNo] = useState('MCI-99481')
  const [handoverNotes, setHandoverNotes] = useState('Patient stable, handed over to ER resuscitation bed 2.')
  const [checklistValid, setChecklistValid] = useState(false)
  const [signed, setSigned] = useState(true)

  if (isLoading || !mission) return <AppLoadingScreen message="Loading Hospital Handover Form..." />

  const hospitalName = mission.destinationHospital?.name || 'Balaji Apex Tertiary Hospital'

  const handleCompleteHandover = () => {
    completeHandoverMutation.mutate(
      {
        hospitalId: mission.destinationHospital?.id || 'HOSP-01',
        receivingDoctorName: doctorName,
        receivingNurseName: nurseName,
        doctorRegistrationNo: docRegNo,
        handoverTime: new Date().toISOString(),
        vitalSignsAtHandover: mission.encounter?.initialVitals || {
          timestamp: new Date().toISOString(),
          bloodPressureSystolic: 130,
          bloodPressureDiastolic: 84,
          pulseRateBpm: 88,
          spo2Percent: 98,
        },
        belongingsHandedOver: true,
        handoverNotes,
        signatureCaptured: signed,
      },
      {
        onSuccess: () => {
          navigate(`/ems/missions/${incidentId}/complete`)
        },
      }
    )
  }

  const isFormValid = doctorName.trim().length > 0 && nurseName.trim().length > 0 && checklistValid && signed

  const getDisabledReason = () => {
    if (!doctorName || !nurseName) return 'Enter receiving doctor and nurse names'
    if (!checklistValid) return 'Complete all mandatory handover checklist items'
    if (!signed) return 'Capture receiving doctor digital signature'
    return undefined
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Handover Header */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-2 shadow-xs">
        <span className="text-[11px] font-black bg-teal-500/10 text-teal-700 border border-teal-500/30 px-2.5 py-0.5 rounded tracking-wide uppercase">
          HOSPITAL HANDOVER & TRANSFER
        </span>
        <h1 className="text-xl font-black text-on-surface font-headline leading-tight">{hospitalName}</h1>
        <p className="text-xs text-on-surface-variant font-medium">Patient: Ramesh Sharma (58/M) • {mission.incident.chiefComplaint}</p>
      </div>

      {/* Receiving Clinical Staff Form */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
          <UserCheck className="w-4 h-4 text-primary shrink-0" />
          Receiving Hospital Staff
        </h3>

        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Receiving Doctor *</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full h-12 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Doc Registration No.</label>
              <input
                type="text"
                value={docRegNo}
                onChange={(e) => setDocRegNo(e.target.value)}
                className="w-full h-12 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-on-surface-variant block mb-1">Receiving Staff Nurse *</label>
            <input
              type="text"
              value={nurseName}
              onChange={(e) => setNurseName(e.target.value)}
              className="w-full h-12 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-on-surface-variant block mb-1">Clinical Handover Remarks</label>
            <textarea
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              rows={2}
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Mandatory Handover Checklist Component */}
      <HandoverChecklist onChecklistChange={(valid) => setChecklistValid(valid)} />

      {/* Signature Capture Card */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-headline">
            <PenTool className="w-4 h-4 text-primary shrink-0" />
            Receiving Doctor Verification Signature
          </h3>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
              signed ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
            }`}
          >
            {signed ? 'Signature Verified' : 'Pending Signature'}
          </span>
        </div>

        <div
          onClick={() => setSigned(true)}
          className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99] ${
            signed
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 shadow-2xs'
              : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline'
          }`}
        >
          {signed ? (
            <div className="text-center space-y-1">
              <p className="font-serif italic text-lg font-bold text-slate-900">Dr. Ananya Roy</p>
              <p className="text-[11px] text-emerald-700 font-semibold">✓ Digital Signature Captured ({new Date().toLocaleTimeString()})</p>
            </div>
          ) : (
            <p className="text-xs font-semibold">Tap here to capture doctor e-signature</p>
          )}
        </div>
      </div>

      {/* Workflow Action Button */}
      <StickyMissionAction
        label="Complete Handover & Proceed to Reset"
        onClick={handleCompleteHandover}
        onBack={() => navigate(`/ems/missions/${incidentId}/transport`)}
        disabled={!isFormValid}
        disabledReason={getDisabledReason()}
        loading={completeHandoverMutation.isPending}
        variant="emerald"
      />
    </div>
  )
}
