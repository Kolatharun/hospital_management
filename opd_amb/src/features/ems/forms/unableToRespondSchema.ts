import { z } from 'zod'

export const unableToRespondSchema = z.object({
  reasonCategory: z.enum([
    'VEHICLE_BREAKDOWN',
    'EQUIPMENT_FAILURE',
    'CREW_INCAPACITATED',
    'ACTIVE_PATIENT_ONBOARD',
    'TRAFFIC_GRIDLOCK',
    'OTHER'
  ], { message: 'Please select a reason' }),
  notes: z.string().min(5, 'Please provide details regarding inability to respond'),
})

export type UnableToRespondFormData = z.infer<typeof unableToRespondSchema>
