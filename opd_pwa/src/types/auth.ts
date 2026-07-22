export type AuthState =
  | 'anonymous'
  | 'phone_entered'
  | 'otp_sent'
  | 'otp_verifying'
  | 'otp_verified'
  | 'profile_required'
  | 'authenticated'
  | 'session_expired'
  | 'logged_out';

export interface AuthSession {
  token: string;
  mobile: string;
  patientId?: string;
  mrNumber?: string;
  expiresAt: string;
}
