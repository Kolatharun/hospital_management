import React, { useState } from 'react'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { useEMSUiStore } from '../state/emsUiStore'

export const CrewHelpSheet: React.FC = () => {
  const { activeSheet, closeSheet } = useEMSUiStore()
  const [distressTriggered, setDistressTriggered] = useState(false)

  if (activeSheet !== 'CREW_HELP') return null

  const handleTriggerSOS = () => {
    setDistressTriggered(true)
    setTimeout(() => {
      alert('EMERGENCY DISTRESS BEACON SIGNAL SENT TO BALAJI CENTRAL DISPATCH WITH GPS COORDINATES!')
      closeSheet()
      setDistressTriggered(false)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-on-surface/40 backdrop-blur-sm flex items-end justify-center animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[2rem] border-t border-outline-variant p-6 pb-safe shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center border border-error/30">
              <MaterialIcon name="emergency_share" filled className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Crew Emergency &amp; Assistance</h3>
              <p className="font-label-sm text-label-sm text-error font-semibold">Priority Responder Distress Protocol</p>
            </div>
          </div>
          <button
            onClick={closeSheet}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-full bg-surface-container"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleTriggerSOS}
            disabled={distressTriggered}
            className="w-full h-14 bg-error text-on-error font-bold text-body-lg rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <MaterialIcon name="sos" filled className={distressTriggered ? 'animate-spin' : ''} />
            <span>{distressTriggered ? 'TRANSMITTING DISPATCH SOS...' : 'TRIGGER MAYDAY / CREW DISTRESS SOS'}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:108"
              className="p-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold text-xs flex flex-col items-center gap-2 min-h-[64px]"
            >
              <MaterialIcon name="call" className="text-primary" />
              <span>Call Dispatch Hotline</span>
            </a>
            <button
              onClick={() => alert('Channel 108 Emergency Frequency Open')}
              className="p-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold text-xs flex flex-col items-center gap-2 min-h-[64px]"
            >
              <MaterialIcon name="settings_input_antenna" className="text-tertiary" />
              <span>Open Radio Channel 108</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
