import { z } from 'zod'

export const careActionSchema = z.object({
  category: z.enum([
    'OXYGEN',
    'MEDICATION',
    'IV_FLUIDS',
    'ECG',
    'CPR',
    'AIRWAY',
    'SPLINT',
    'OTHER'
  ], { message: 'Select intervention category' }),
  title: z.string().min(3, 'Title required'),
  dosageDetails: z.string().optional(),
  notes: z.string().optional(),
})

export type CareActionFormData = z.infer<typeof careActionSchema>
