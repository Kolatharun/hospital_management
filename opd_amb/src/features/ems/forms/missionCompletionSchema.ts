import { z } from 'zod'

export const missionCompletionSchema = z.object({
  outcome: z.enum([
    'PATIENT_DELIVERED',
    'PATIENT_REFUSED',
    'PATIENT_DECEASED',
    'CANCELLED_EN_ROUTE',
    'NO_PATIENT_LOCATED'
  ], { message: 'Please select a final mission outcome' }),
  totalDistanceKm: z.number().min(0.1, 'Distance must be recorded'),
  summaryNotes: z.string().min(5, 'Summary notes required for medical logbook'),
  vehicleCleanedAndRestocked: z.literal(true, { message: 'Confirm vehicle cleaning & restocking for next dispatch' }),
})

export type MissionCompletionFormData = z.infer<typeof missionCompletionSchema>
