import { z } from 'zod'

export const vitalSignsSchema = z.object({
  bloodPressureSystolic: z.number().min(40).max(280, 'Systolic BP out of range'),
  bloodPressureDiastolic: z.number().min(20).max(180, 'Diastolic BP out of range'),
  pulseRateBpm: z.number().min(20).max(250, 'Pulse rate out of range'),
  respiratoryRate: z.number().min(4).max(60, 'Respiratory rate out of range'),
  spo2Percent: z.number().min(50).max(100, 'SpO2 must be between 50% and 100%'),
  bodyTempCelsius: z.number().min(30).max(45, 'Temperature out of range').optional(),
  gcsTotal: z.number().min(3).max(15, 'GCS must be between 3 and 15').optional(),
  painScale10: z.number().min(0).max(10, 'Pain scale must be 0 to 10').optional(),
  notes: z.string().optional(),
})

export type VitalSignsFormData = z.infer<typeof vitalSignsSchema>
