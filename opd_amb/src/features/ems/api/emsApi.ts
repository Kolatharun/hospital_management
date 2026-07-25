import { env } from '@/lib/env'
import { apiClient } from '@/lib/apiClient'
import { emsMockApi } from './emsMockApi'
import {
  Shift,
  Mission,
  Hospital,
  VitalSigns,
  CareEvent,
  Handover,
  MissionCompletion,
  SyncRecord
} from './emsTypes'

export const emsApi = {
  async getShift(): Promise<Shift | null> {
    if (env.useMockApi) return emsMockApi.getShift()
    return apiClient<Shift | null>('/ems/shift')
  },

  async startShift(readiness: any): Promise<Shift> {
    if (env.useMockApi) return emsMockApi.startShift(readiness)
    return apiClient<Shift>('/ems/shift/start', {
      method: 'POST',
      body: JSON.stringify(readiness),
    })
  },

  async getActiveMission(): Promise<Mission | null> {
    if (env.useMockApi) return emsMockApi.getActiveMission()
    return apiClient<Mission | null>('/ems/missions/active')
  },

  async acknowledgeMission(incidentId: string): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.acknowledgeMission(incidentId)
    return apiClient<Mission>(`/ems/missions/${incidentId}/acknowledge`, {
      method: 'POST',
    })
  },

  async declineMission(reason: string): Promise<void> {
    if (env.useMockApi) return emsMockApi.declineMission(reason)
    return apiClient<void>('/ems/missions/decline', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  async confirmArrivalOnScene(): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.confirmArrivalOnScene()
    return apiClient<Mission>('/ems/missions/arrival-scene', { method: 'POST' })
  },

  async saveSceneSafety(safe: boolean, hazards: string[] = []): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.saveSceneSafety(safe, hazards)
    return apiClient<Mission>('/ems/missions/scene-safety', {
      method: 'POST',
      body: JSON.stringify({ safe, hazards }),
    })
  },

  async addVitals(vitals: VitalSigns): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.addVitals(vitals)
    return apiClient<Mission>('/ems/patient/vitals', {
      method: 'POST',
      body: JSON.stringify(vitals),
    })
  },

  async addCareEvent(care: CareEvent): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.addCareEvent(care)
    return apiClient<Mission>('/ems/patient/care-event', {
      method: 'POST',
      body: JSON.stringify(care),
    })
  },

  async getHospitals(): Promise<Hospital[]> {
    if (env.useMockApi) return emsMockApi.getHospitals()
    return apiClient<Hospital[]>('/ems/hospitals')
  },

  async selectHospitalAndSendPreAlert(
    hospitalId: string,
    specialNeeds: string[]
  ): Promise<Mission> {
    if (env.useMockApi)
      return emsMockApi.selectHospitalAndSendPreAlert(hospitalId, specialNeeds)
    return apiClient<Mission>('/ems/transport/pre-alert', {
      method: 'POST',
      body: JSON.stringify({ hospitalId, specialNeeds }),
    })
  },

  async completeHandover(handover: Handover): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.completeHandover(handover)
    return apiClient<Mission>('/ems/handover', {
      method: 'POST',
      body: JSON.stringify(handover),
    })
  },

  async completeMission(completion: MissionCompletion): Promise<Mission> {
    if (env.useMockApi) return emsMockApi.completeMission(completion)
    return apiClient<Mission>('/ems/missions/complete', {
      method: 'POST',
      body: JSON.stringify(completion),
    })
  },

  async getHistory(): Promise<Mission[]> {
    if (env.useMockApi) return emsMockApi.getHistory()
    return apiClient<Mission[]>('/ems/history')
  },

  async getSyncStatus(): Promise<SyncRecord[]> {
    if (env.useMockApi) return emsMockApi.getSyncStatus()
    return apiClient<SyncRecord[]>('/ems/sync/status')
  },
}
