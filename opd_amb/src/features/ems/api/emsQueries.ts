import { useQuery } from '@tanstack/react-query'
import { emsApi } from './emsApi'
import { emsQueryKeys } from './emsQueryKeys'

export function useShiftQuery() {
  return useQuery({
    queryKey: emsQueryKeys.shift(),
    queryFn: () => emsApi.getShift(),
    staleTime: 30000,
  })
}

export function useActiveMissionQuery() {
  return useQuery({
    queryKey: emsQueryKeys.activeMission(),
    queryFn: () => emsApi.getActiveMission(),
    refetchInterval: 5000, // Poll every 5s for emergency updates in dispatch
  })
}

export function useHospitalsQuery() {
  return useQuery({
    queryKey: emsQueryKeys.hospitals(),
    queryFn: () => emsApi.getHospitals(),
    staleTime: 60000,
  })
}

export function useMissionHistoryQuery() {
  return useQuery({
    queryKey: emsQueryKeys.history(),
    queryFn: () => emsApi.getHistory(),
  })
}

export function useSyncStatusQuery() {
  return useQuery({
    queryKey: emsQueryKeys.syncStatus(),
    queryFn: () => emsApi.getSyncStatus(),
    refetchInterval: 10000,
  })
}
