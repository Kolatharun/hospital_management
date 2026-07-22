import { z } from 'zod';

export const createProfileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Select gender' }),
  city: z.string().min(2, 'City or locality is required'),
  address: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code').optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  preferredLanguage: z.enum(['en', 'hi', 'mr']),
  ownershipConsent: z.boolean().refine((val) => val === true, 'You must consent to register your account'),
});

export type CreateProfileFormData = z.infer<typeof createProfileSchema>;

export const editProfileSchema = createProfileSchema.omit({ ownershipConsent: true });
export type EditProfileFormData = z.infer<typeof editProfileSchema>;

export const changeMobileSchema = z.object({
  currentOtp: z.string().length(6, 'Current OTP must be 6 digits'),
  newMobile: z
    .string()
    .length(10, 'New mobile number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  newOtp: z.string().length(6, 'New OTP must be 6 digits'),
});

export type ChangeMobileFormData = z.infer<typeof changeMobileSchema>;
