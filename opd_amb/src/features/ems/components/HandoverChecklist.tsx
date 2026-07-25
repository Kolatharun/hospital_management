import React, { useState } from 'react'
import { CheckSquare, Square, ShieldAlert } from 'lucide-react'

export interface HandoverChecklistItem {
  id: string
  label: string
  required: boolean
}

const DEFAULT_ITEMS: HandoverChecklistItem[] = [
  { id: 'vitals_reported', label: 'Vital signs trend & ECG reported to receiving doctor', required: true },
  { id: 'meds_handed_over', label: 'All pre-hospital medications & oxygen dosage documented', required: true },
  { id: 'patient_transferred', label: 'Patient physically transferred to hospital bed/stretcher', required: true },
  { id: 'belongings_transferred', label: 'Patient valuables & personal belongings handed to family/staff', required: true },
  { id: 'epcr_signed', label: 'Receiving doctor/nurse verification signature captured', required: true },
]

interface HandoverChecklistProps {
  onChecklistChange: (completed: boolean, checkedIds: string[]) => void
}

export const HandoverChecklist: React.FC<HandoverChecklistProps> = ({ onChecklistChange }) => {
  const [checkedIds, setCheckedIds] = useState<string[]>([])

  const toggleItem = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter((item) => item !== id)
      : [...checkedIds, id]
    setCheckedIds(next)

    const allRequiredPassed = DEFAULT_ITEMS.filter((i) => i.required).every((i) =>
      next.includes(i.id)
    )
    onChecklistChange(allRequiredPassed, next)
  }

  const allCompleted = DEFAULT_ITEMS.every((i) => checkedIds.includes(i.id))

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          Mandatory Handover Protocol Checklist
        </h4>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            allCompleted
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
          }`}
        >
          {checkedIds.length} / {DEFAULT_ITEMS.length} Verified
        </span>
      </div>

      <div className="space-y-2">
        {DEFAULT_ITEMS.map((item) => {
          const isChecked = checkedIds.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                isChecked
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-on-surface'
                  : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-outline'
              }`}
            >
              {isChecked ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-variant/60 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs font-medium leading-relaxed">
                <span>{item.label}</span>
                {item.required && <span className="text-red-500 font-bold ml-1">*Required</span>}
              </div>
            </button>
          )
        })}
      </div>

      {!allCompleted && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>All mandatory checklist items must be verified before completing handover.</span>
        </div>
      )}
    </div>
  )
}
