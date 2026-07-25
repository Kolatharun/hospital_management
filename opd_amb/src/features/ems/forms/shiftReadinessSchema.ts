import { z } from 'zod'

export const shiftReadinessSchema = z.object({
  oxygenPressurePsi: z.number().min(500, 'Oxygen pressure must be at least 500 PSI for duty readiness'),
  defibrillatorBatteryPercent: z.number().min(50, 'Defibrillator battery must be at least 50%'),
  stretcherFunctional: z.literal(true, { message: 'Stretcher must be operational' }),
  firstAidKitStocked: z.literal(true, { message: 'First aid & trauma kit must be fully stocked' }),
  fuelLevelPercent: z.number().min(25, 'Ambulance fuel level must be at least 25%'),
  suctionFunctional: z.literal(true, { message: 'Suction apparatus must be functional' }),
  medicationsChecked: z.literal(true, { message: 'Emergency drug kit expiry must be verified' }),
  notes: z.string().optional(),
})

export type ShiftReadinessFormData = z.infer<typeof shiftReadinessSchema>
