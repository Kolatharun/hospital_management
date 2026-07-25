import { z } from 'zod'

export const handoverSchema = z.object({
  receivingDoctorName: z.string().min(2, 'Doctor name required'),
  receivingNurseName: z.string().min(2, 'Nurse name required'),
  doctorRegistrationNo: z.string().optional(),
  belongingsHandedOver: z.boolean(),
  handoverNotes: z.string().optional(),
  signatureConfirmed: z.literal(true, { message: 'Digital receiving signature verification required' }),
})

export type HandoverFormData = z.infer<typeof handoverSchema>
