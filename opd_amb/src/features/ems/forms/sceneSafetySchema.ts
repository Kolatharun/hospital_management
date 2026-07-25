import { z } from 'zod'

export const sceneSafetySchema = z.object({
  safeToEnter: z.boolean(),
  hazards: z.array(z.string()).default([]),
  patientLocated: z.boolean(),
  multiplePatients: z.boolean().default(false),
  notes: z.string().optional(),
})

export type SceneSafetyFormData = z.infer<typeof sceneSafetySchema>
