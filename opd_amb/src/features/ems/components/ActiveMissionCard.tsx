import React, { useState, useEffect } from 'react'
import { Mission } from '../api/emsTypes'
import { getMissionStatusLabel, getMissionRoute } from '../utils/missionStatus'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, ChevronRight, Clock, MapPin } from 'lucide-react'

interface ActiveMissionCardProps {
  mission: Mission
}

export const ActiveMissionCard: React.FC<ActiveMissionCardProps> = ({ mission }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const startTime = new Date(mission.assignedAt).getTime()
    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [mission.assignedAt])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const targetRoute = getMissionRoute(mission.status, mission.incident.id)
  const isCurrentPageTarget = location.pathname === targetRoute

  return (
    <div className="bg-surface-container-high border-b border-outline-variant p-4 space-y-2 shadow-sm transition-all">
      {/* Top Meta Line: Priority Pill, Mission Stage Label, Tabular Live Clock */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[11px] font-black tracking-wide px-2.5 py-0.5 rounded-full shrink-0 uppercase shadow-xs ${
              mission.incident.priority === 1
                ? 'bg-red-600 text-white animate-pulse'
                : mission.incident.priority === 2
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-primary text-on-primary'
            }`}
          >
            {mission.incident.priorityCode} EMERGENCY
          </span>
          <span className="text-xs font-bold text-on-surface truncate">
            {getMissionStatusLabel(mission.status)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary bg-surface border border-outline-variant px-2.5 py-1 rounded-full shrink-0 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Bottom Main Content: Incident Complaint & Location, Call Icon & Action Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 className="text-xs font-bold text-on-surface truncate leading-tight">
            {mission.incident.chiefComplaint}
          </h4>
          <p className="text-[11px] text-on-surface-variant truncate flex items-center gap-1 font-normal">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{mission.incident.location.address}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`tel:${mission.incident.callerPhone}`}
            className="p-2 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all active:scale-95"
            title="Call Dispatch / Caller"
          >
            <Phone className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => navigate(targetRoute)}
            className={`py-1.5 px-3 rounded-xl font-black text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 ${
              isCurrentPageTarget
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>Action</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  )
}
