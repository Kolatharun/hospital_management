import { z } from 'zod';

export const supportIssueSchema = z.object({
  category: z.enum(['appointment_issue', 'queue_delay', 'prescription_download', 'pharmacy_request', 'app_technical', 'other'], {
    message: 'Select an issue category',
  }),
  description: z
    .string()
    .min(10, 'Please describe your issue in at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  contactNumber: z
    .string()
    .length(10, 'Contact number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  preferredCallbackTime: z.enum(['morning', 'afternoon', 'evening']),
});

export type SupportIssueFormData = z.infer<typeof supportIssueSchema>;
