import React, { useState } from 'react'
import { useMissionHistoryQuery } from '../api/emsQueries'
import { Mission } from '../api/emsTypes'
import { getMissionStatusLabel } from '../utils/missionStatus'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'
import { Search, Filter, Calendar, MapPin, FileText, ChevronRight, X, Clock, ShieldCheck } from 'lucide-react'

export const MissionHistoryPage: React.FC = () => {
  const { data: history = [], isLoading } = useMissionHistoryQuery()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<'ALL' | '1' | '2' | '3'>('ALL')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  if (isLoading) return <AppLoadingScreen message="Loading Responder Run Records..." />

  const filteredHistory = history.filter((m) => {
    const matchesSearch =
      m.incident.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.incident.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority =
      filterPriority === 'ALL' || m.incident.priority.toString() === filterPriority

    return matchesSearch && matchesPriority
  })

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Search & Filter Header */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-black text-on-surface font-headline">Mission Run History</h1>
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shrink-0">
            {history.length} Completed Runs
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-4 text-on-surface-variant shrink-0" />
          <input
            type="text"
            placeholder="Search complaint, address, or incident ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-on-surface-variant font-bold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          {['ALL', '1', '2', '3'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p as any)}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full font-bold transition-all shrink-0 active:scale-95 ${
                filterPriority === p
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {p === 'ALL' ? 'All Priority' : `P${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* History Mission Cards */}
      <div className="space-y-3.5">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-outline-variant rounded-2xl space-y-2 shadow-xs">
            <FileText className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
            <p className="text-sm font-bold text-on-surface font-headline">No Mission Records Found</p>
            <p className="text-xs text-on-surface-variant">Try adjusting your search query or priority filters.</p>
          </div>
        ) : (
          filteredHistory.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMission(m)}
              className="bg-surface border border-outline-variant hover:border-primary p-4 rounded-2xl cursor-pointer transition-all shadow-xs hover:shadow-md space-y-2.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded shrink-0 uppercase ${
                      m.incident.priority === 1 ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {m.incident.priorityCode}
                  </span>
                  <span className="text-xs font-mono font-bold text-on-surface-variant truncate">{m.id}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {getMissionStatusLabel(m.status)}
                </span>
              </div>

              <h3 className="text-sm font-bold text-on-surface leading-tight font-headline">{m.incident.chiefComplaint}</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{m.incident.location.address}</span>
              </p>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/60">
                <span>Date: {new Date(m.assignedAt).toLocaleDateString()}</span>
                <span className="font-bold text-primary flex items-center gap-0.5">
                  View Record <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Read-Only Mission Detail Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-4 space-y-4 text-on-surface max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                  READ-ONLY MISSION RECORD
                </span>
                <h3 className="text-lg font-black text-on-surface mt-1">{selectedMission.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                <p className="font-bold text-on-surface">{selectedMission.incident.chiefComplaint}</p>
                <p className="text-on-surface-variant">Location: {selectedMission.incident.location.address}</p>
                <p className="text-on-surface-variant">Priority: {selectedMission.incident.priorityCode}</p>
              </div>

              {selectedMission.encounter && (
                <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                  <p className="font-bold text-primary">Patient Record</p>
                  <p className="text-on-surface">Name: {selectedMission.encounter.patient.fullName}</p>
                  <p className="text-on-surface">Impression: {selectedMission.encounter.primaryImpression}</p>
                  <p className="text-on-surface-variant">Allergies: {selectedMission.encounter.allergies || 'None reported'}</p>
                </div>
              )}

              {selectedMission.destinationHospital && (
                <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                  <p className="font-bold text-emerald-700">Receiving Destination</p>
                  <p className="text-on-surface font-semibold">{selectedMission.destinationHospital.name}</p>
                  <p className="text-on-surface-variant">{selectedMission.destinationHospital.address}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMission(null)}
              className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-md"
            >
              Close Record View
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
