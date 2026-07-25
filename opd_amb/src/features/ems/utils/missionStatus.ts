import { MissionStatus } from '../api/emsTypes'

const VALID_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  OFF_DUTY: ['READINESS_REQUIRED', 'AVAILABLE'],
  READINESS_REQUIRED: ['AVAILABLE', 'OFF_DUTY'],
  AVAILABLE: ['ALERTING', 'ASSIGNED', 'OFF_DUTY'],
  ALERTING: ['ACKNOWLEDGED', 'EN_ROUTE', 'UNABLE_TO_RESPOND', 'CANCELLED'],
  ASSIGNED: ['ACKNOWLEDGED', 'EN_ROUTE', 'UNABLE_TO_RESPOND', 'CANCELLED'],
  ACKNOWLEDGED: ['EN_ROUTE', 'UNABLE_TO_RESPOND', 'CANCELLED'],
  EN_ROUTE: ['ON_SCENE', 'UNABLE_TO_LOCATE', 'CANCELLED'],
  ON_SCENE: ['PATIENT_CARE', 'SCENE_UNSAFE', 'UNABLE_TO_ACCESS', 'NO_PATIENT_FOUND', 'MULTIPLE_PATIENTS', 'CANCELLED'],
  PATIENT_CARE: ['DESTINATION_SELECTED', 'TRANSPORTING', 'PATIENT_REFUSED', 'TREATED_ON_SCENE', 'TRANSFERRED', 'CANCELLED'],
  DESTINATION_SELECTED: ['TRANSPORTING', 'PATIENT_CARE', 'CANCELLED'],
  TRANSPORTING: ['HANDOVER', 'CANCELLED'],
  HANDOVER: ['RESET_REQUIRED', 'COMPLETED'],
  RESET_REQUIRED: ['COMPLETED', 'AVAILABLE'],
  COMPLETED: ['AVAILABLE', 'OFF_DUTY'],
  UNABLE_TO_RESPOND: ['AVAILABLE'],
  SCENE_UNSAFE: ['AVAILABLE', 'PATIENT_CARE'],
  UNABLE_TO_LOCATE: ['AVAILABLE'],
  UNABLE_TO_ACCESS: ['AVAILABLE'],
  NO_PATIENT_FOUND: ['AVAILABLE'],
  MULTIPLE_PATIENTS: ['PATIENT_CARE', 'AVAILABLE'],
  PATIENT_REFUSED: ['RESET_REQUIRED', 'COMPLETED', 'AVAILABLE'],
  TREATED_ON_SCENE: ['RESET_REQUIRED', 'COMPLETED', 'AVAILABLE'],
  TRANSFERRED: ['RESET_REQUIRED', 'COMPLETED', 'AVAILABLE'],
  CANCELLED: ['AVAILABLE', 'RESET_REQUIRED'],
  OFFLINE_SYNC_PENDING: ['AVAILABLE', 'COMPLETED'],
}

export function canTransition(from: MissionStatus, to: MissionStatus): boolean {
  if (from === to) return true
  const allowed = VALID_TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}

export function isActiveMission(status: MissionStatus): boolean {
  const nonActiveStatuses: MissionStatus[] = [
    'OFF_DUTY',
    'READINESS_REQUIRED',
    'AVAILABLE',
    'COMPLETED',
    'CANCELLED',
    'UNABLE_TO_RESPOND',
  ]
  return !nonActiveStatuses.includes(status)
}

export function isMissionReadOnly(status: MissionStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'UNABLE_TO_RESPOND'
}

export function getMissionStatusLabel(status: MissionStatus): string {
  switch (status) {
    case 'OFF_DUTY':
      return 'Off Duty'
    case 'READINESS_REQUIRED':
      return 'Readiness Checklist Required'
    case 'AVAILABLE':
      return 'Available for Duty'
    case 'ALERTING':
    case 'ASSIGNED':
      return 'Incoming Alert'
    case 'ACKNOWLEDGED':
      return 'Alert Acknowledged'
    case 'EN_ROUTE':
      return 'En Route to Scene'
    case 'ON_SCENE':
      return 'Arrived On Scene'
    case 'PATIENT_CARE':
      return 'Patient Assessment & Care'
    case 'DESTINATION_SELECTED':
      return 'Hospital Destination Selected'
    case 'TRANSPORTING':
      return 'Transporting to Hospital'
    case 'HANDOVER':
      return 'Hospital Handover'
    case 'RESET_REQUIRED':
      return 'Ambulance Reset Required'
    case 'COMPLETED':
      return 'Mission Completed'
    case 'UNABLE_TO_RESPOND':
      return 'Unable to Respond'
    case 'SCENE_UNSAFE':
      return 'Scene Unsafe'
    case 'UNABLE_TO_LOCATE':
      return 'Unable to Locate Patient'
    case 'UNABLE_TO_ACCESS':
      return 'Access Blocked'
    case 'NO_PATIENT_FOUND':
      return 'No Patient Found'
    case 'MULTIPLE_PATIENTS':
      return 'Multiple Patients On Scene'
    case 'PATIENT_REFUSED':
      return 'Patient Refused Care'
    case 'TREATED_ON_SCENE':
      return 'Treated On Scene'
    case 'TRANSFERRED':
      return 'Transferred to Other Unit'
    case 'CANCELLED':
      return 'Mission Cancelled'
    case 'OFFLINE_SYNC_PENDING':
      return 'Sync Pending'
    default:
      return status
  }
}

export function getMissionStatusTone(
  status: MissionStatus
): 'default' | 'urgent' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'ALERTING':
    case 'ASSIGNED':
    case 'SCENE_UNSAFE':
    case 'CANCELLED':
      return 'danger'
    case 'EN_ROUTE':
    case 'TRANSPORTING':
      return 'urgent'
    case 'ON_SCENE':
    case 'PATIENT_CARE':
    case 'DESTINATION_SELECTED':
    case 'HANDOVER':
    case 'RESET_REQUIRED':
      return 'warning'
    case 'COMPLETED':
    case 'AVAILABLE':
      return 'success'
    default:
      return 'default'
  }
}

export function getMissionRoute(status: MissionStatus, incidentId?: string): string {
  const id = incidentId || 'active'
  switch (status) {
    case 'ALERTING':
    case 'ASSIGNED':
      return `/ems/missions/${id}/alert`
    case 'ACKNOWLEDGED':
    case 'EN_ROUTE':
      return `/ems/missions/${id}`
    case 'ON_SCENE':
    case 'SCENE_UNSAFE':
    case 'UNABLE_TO_ACCESS':
    case 'UNABLE_TO_LOCATE':
      return `/ems/missions/${id}/scene`
    case 'PATIENT_CARE':
    case 'PATIENT_REFUSED':
    case 'TREATED_ON_SCENE':
      return `/ems/missions/${id}/care`
    case 'DESTINATION_SELECTED':
    case 'TRANSPORTING':
      return `/ems/missions/${id}/transport`
    case 'HANDOVER':
      return `/ems/missions/${id}/handover`
    case 'RESET_REQUIRED':
    case 'COMPLETED':
      return `/ems/missions/${id}/complete`
    default:
      return '/ems'
  }
}

export function getNextMissionAction(
  status: MissionStatus
): { label: string; targetStatus: MissionStatus; route: string } | null {
  switch (status) {
    case 'ALERTING':
    case 'ASSIGNED':
      return { label: 'Accept Mission', targetStatus: 'ACKNOWLEDGED', route: 'navigation' }
    case 'ACKNOWLEDGED':
      return { label: 'Start En-Route Navigation', targetStatus: 'EN_ROUTE', route: 'navigation' }
    case 'EN_ROUTE':
      return { label: 'Confirm Arrival On Scene', targetStatus: 'ON_SCENE', route: 'scene' }
    case 'ON_SCENE':
      return { label: 'Begin Patient Assessment', targetStatus: 'PATIENT_CARE', route: 'care' }
    case 'PATIENT_CARE':
      return { label: 'Select Hospital & Transport', targetStatus: 'DESTINATION_SELECTED', route: 'transport' }
    case 'DESTINATION_SELECTED':
      return { label: 'Start Transporting', targetStatus: 'TRANSPORTING', route: 'transport' }
    case 'TRANSPORTING':
      return { label: 'Arrived at Hospital Handover', targetStatus: 'HANDOVER', route: 'handover' }
    case 'HANDOVER':
      return { label: 'Complete Handover & Reset', targetStatus: 'RESET_REQUIRED', route: 'complete' }
    case 'RESET_REQUIRED':
      return { label: 'Finalize Reset & Complete Mission', targetStatus: 'COMPLETED', route: 'complete' }
    default:
      return null
  }
}

export function getMissionStatusInfo(status: MissionStatus) {
  return {
    label: getMissionStatusLabel(status),
    tone: getMissionStatusTone(status),
    route: getMissionRoute(status),
    isActive: isActiveMission(status),
    isReadOnly: isMissionReadOnly(status),
  }
}
