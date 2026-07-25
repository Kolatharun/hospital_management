import { useActiveMissionQuery } from '../api/emsQueries'
import { getMissionStatusInfo } from '../utils/missionStatus'

export function useActiveMission() {
  const { data: mission, isLoading, isError, refetch } = useActiveMissionQuery()
  const statusInfo = mission ? getMissionStatusInfo(mission.status) : null

  return {
    mission,
    isLoading,
    isError,
    refetch,
    statusInfo,
    hasActiveMission: !!mission && mission.status !== 'COMPLETED' && mission.status !== 'CANCELLED',
  }
}
