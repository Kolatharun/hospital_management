import { z } from 'zod';

export const loginSchema = z.object({
  mobile: z
    .string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export type OTPFormData = z.infer<typeof otpSchema>;
