import React, { useState } from 'react'
import { MissionStatus } from '../api/emsTypes'
import { emsMockApi } from '../api/emsMockApi'
import { useQueryClient } from '@tanstack/react-query'
import { emsQueryKeys } from '../api/emsQueryKeys'
import { Wrench, Check, X, ShieldAlert } from 'lucide-react'

const ALL_STATUSES: MissionStatus[] = [
  'OFF_DUTY',
  'READINESS_REQUIRED',
  'AVAILABLE',
  'ALERTING',
  'ASSIGNED',
  'ACKNOWLEDGED',
  'EN_ROUTE',
  'ON_SCENE',
  'PATIENT_CARE',
  'DESTINATION_SELECTED',
  'TRANSPORTING',
  'HANDOVER',
  'RESET_REQUIRED',
  'COMPLETED',
  'UNABLE_TO_RESPOND',
  'SCENE_UNSAFE',
  'UNABLE_TO_LOCATE',
  'UNABLE_TO_ACCESS',
  'NO_PATIENT_FOUND',
  'MULTIPLE_PATIENTS',
  'PATIENT_REFUSED',
  'TREATED_ON_SCENE',
  'TRANSFERRED',
  'CANCELLED',
  'OFFLINE_SYNC_PENDING',
]

export const DevStateSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  if (import.meta.env.PROD) return null

  const handleSetState = async (status: MissionStatus) => {
    try {
      if (status === 'AVAILABLE' || status === 'OFF_DUTY') {
        await emsMockApi.resetMissionToAvailable()
      } else {
        await emsMockApi.updateMissionStatus(status)
      }
      await queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
      setOpen(false)
    } catch (e) {
      console.error('Failed state transition override', e)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-3 z-50 p-2.5 bg-slate-900 text-amber-400 rounded-full shadow-2xl border border-amber-500/40 hover:scale-105 transition-all"
        title="Development Mission State Switcher"
      >
        <Wrench className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-4 text-white space-y-3 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>DEV: Force Mission State</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select any mission status to test state machine transitions and UI behavior:
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {ALL_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSetState(st)}
                  className="text-left text-xs font-mono p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-between"
                >
                  <span className="truncate">{st}</span>
                  <Check className="w-3 h-3 text-cyan-400 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
