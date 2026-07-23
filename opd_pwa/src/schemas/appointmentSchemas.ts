import { z } from 'zod';

export const bookingSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  date: z.string().min(1, 'Date is required'),
  slotId: z.string().min(1, 'Time slot is required'),
  consultationType: z.enum(['new', 'review']),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export type CancelAppointmentFormData = z.infer<typeof cancelAppointmentSchema>;
