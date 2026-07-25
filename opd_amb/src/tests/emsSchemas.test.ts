import { describe, it, expect } from 'vitest'
import { vitalSignsSchema } from '@/features/ems/forms/vitalSignsSchema'
import { shiftReadinessSchema } from '@/features/ems/forms/shiftReadinessSchema'

describe('EMS Form Schemas Validation', () => {
  it('validates correct vital signs inputs', () => {
    const result = vitalSignsSchema.safeParse({
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      pulseRateBpm: 72,
      respiratoryRate: 16,
      spo2Percent: 99,
      bodyTempCelsius: 36.6,
      gcsTotal: 15,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid oxygen level below 500 PSI in shift readiness', () => {
    const result = shiftReadinessSchema.safeParse({
      oxygenPressurePsi: 200,
      defibrillatorBatteryPercent: 100,
      stretcherFunctional: true,
      firstAidKitStocked: true,
      fuelLevelPercent: 80,
      suctionFunctional: true,
      medicationsChecked: true,
    })
    expect(result.success).toBe(false)
  })
})
