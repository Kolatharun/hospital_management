export const emsQueryKeys = {
  all: ['ems'] as const,
  shift: () => [...emsQueryKeys.all, 'shift'] as const,
  readiness: () => [...emsQueryKeys.all, 'readiness'] as const,
  activeMission: () => [...emsQueryKeys.all, 'activeMission'] as const,
  incident: (id: string) => [...emsQueryKeys.all, 'incident', id] as const,
  patientEncounter: (incidentId: string) => [...emsQueryKeys.all, 'encounter', incidentId] as const,
  hospitals: () => [...emsQueryKeys.all, 'hospitals'] as const,
  history: (filters?: Record<string, any>) => [...emsQueryKeys.all, 'history', filters] as const,
  syncStatus: () => [...emsQueryKeys.all, 'syncStatus'] as const,
  profile: () => [...emsQueryKeys.all, 'profile'] as const,
}
