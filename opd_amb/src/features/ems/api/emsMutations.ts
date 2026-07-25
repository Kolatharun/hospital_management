import { useMutation, useQueryClient } from '@tanstack/react-query'
import { emsApi } from './emsApi'
import { emsQueryKeys } from './emsQueryKeys'
import { VitalSigns, CareEvent, Handover, MissionCompletion } from './emsTypes'

export function useStartShiftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (readiness: any) => emsApi.startShift(readiness),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.shift() })
    },
  })
}

export function useAcknowledgeMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (incidentId: string) => emsApi.acknowledgeMission(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useDeclineMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => emsApi.declineMission(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useConfirmArrivalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => emsApi.confirmArrivalOnScene(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useSaveSceneSafetyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ safe, hazards }: { safe: boolean; hazards: string[] }) =>
      emsApi.saveSceneSafety(safe, hazards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useAddVitalsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vitals: VitalSigns) => emsApi.addVitals(vitals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useAddCareEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (care: CareEvent) => emsApi.addCareEvent(care),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useSelectHospitalPreAlertMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ hospitalId, specialNeeds }: { hospitalId: string; specialNeeds: string[] }) =>
      emsApi.selectHospitalAndSendPreAlert(hospitalId, specialNeeds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useCompleteHandoverMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (handover: Handover) => emsApi.completeHandover(handover),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
    },
  })
}

export function useCompleteMissionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (completion: MissionCompletion) => emsApi.completeMission(completion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.activeMission() })
      queryClient.invalidateQueries({ queryKey: emsQueryKeys.history() })
    },
  })
}
