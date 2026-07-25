import { describe, it, expect } from 'vitest'
import {
  canTransition,
  getMissionStatusLabel,
  getMissionRoute,
  isActiveMission,
  isMissionReadOnly,
} from '../features/ems/utils/missionStatus'

describe('Central Mission State Machine', () => {
  it('correctly validates valid mission transitions', () => {
    expect(canTransition('OFF_DUTY', 'READINESS_REQUIRED')).toBe(true)
    expect(canTransition('READINESS_REQUIRED', 'AVAILABLE')).toBe(true)
    expect(canTransition('AVAILABLE', 'ALERTING')).toBe(true)
    expect(canTransition('ALERTING', 'ACKNOWLEDGED')).toBe(true)
    expect(canTransition('ACKNOWLEDGED', 'EN_ROUTE')).toBe(true)
    expect(canTransition('EN_ROUTE', 'ON_SCENE')).toBe(true)
    expect(canTransition('ON_SCENE', 'PATIENT_CARE')).toBe(true)
    expect(canTransition('PATIENT_CARE', 'DESTINATION_SELECTED')).toBe(true)
    expect(canTransition('DESTINATION_SELECTED', 'TRANSPORTING')).toBe(true)
    expect(canTransition('TRANSPORTING', 'HANDOVER')).toBe(true)
    expect(canTransition('HANDOVER', 'RESET_REQUIRED')).toBe(true)
    expect(canTransition('RESET_REQUIRED', 'COMPLETED')).toBe(true)
  })

  it('rejects invalid or skipped transitions', () => {
    expect(canTransition('OFF_DUTY', 'HANDOVER')).toBe(false)
    expect(canTransition('ALERTING', 'COMPLETED')).toBe(false)
    expect(canTransition('EN_ROUTE', 'HANDOVER')).toBe(false)
  })

  it('correctly classifies active and read-only missions', () => {
    expect(isActiveMission('EN_ROUTE')).toBe(true)
    expect(isActiveMission('PATIENT_CARE')).toBe(true)
    expect(isActiveMission('AVAILABLE')).toBe(false)
    expect(isActiveMission('COMPLETED')).toBe(false)

    expect(isMissionReadOnly('COMPLETED')).toBe(true)
    expect(isMissionReadOnly('CANCELLED')).toBe(true)
    expect(isMissionReadOnly('PATIENT_CARE')).toBe(false)
  })

  it('generates correct routes for each stage', () => {
    expect(getMissionRoute('ALERTING', 'INC-101')).toBe('/ems/missions/INC-101/alert')
    expect(getMissionRoute('EN_ROUTE', 'INC-101')).toBe('/ems/missions/INC-101')
    expect(getMissionRoute('ON_SCENE', 'INC-101')).toBe('/ems/missions/INC-101/scene')
    expect(getMissionRoute('PATIENT_CARE', 'INC-101')).toBe('/ems/missions/INC-101/care')
    expect(getMissionRoute('TRANSPORTING', 'INC-101')).toBe('/ems/missions/INC-101/transport')
    expect(getMissionRoute('HANDOVER', 'INC-101')).toBe('/ems/missions/INC-101/handover')
    expect(getMissionRoute('RESET_REQUIRED', 'INC-101')).toBe('/ems/missions/INC-101/complete')
  })
})
