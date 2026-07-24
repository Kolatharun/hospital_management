export type CareRelationship = 'myself' | 'father' | 'mother' | 'child' | 'spouse' | 'sibling' | 'other';

export type HealthStatus = 'stable' | 'followup_due' | 'lab_ready' | 'medication_active' | 'post_op';

export interface HealthVitals {
  bloodPressure: string;
  heartRate: number;
  spo2: number;
  temperature?: string;
  lastUpdated: string;
}

export interface CareMember {
  id: string;
  fullName: string;
  relationship: CareRelationship;
  relationshipLabel: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mrn: string;
  avatarInitials: string;
  isPrimaryAccountHolder?: boolean;
  bloodGroup: string;
  emergencyContact: string;
  activeStatus: HealthStatus;
  activeStatusText: string;
  activeAppointmentsCount: number;
  activePrescriptionsCount: number;
  lastVitals: HealthVitals;
  accessPermission: 'full_access' | 'emergency_only' | 'view_only';
}

export type EventCategory = 'appointment' | 'prescription' | 'lab_report' | 'vital' | 'admission';

export interface JourneyEvent {
  id: string;
  patientId: string;
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  category: EventCategory;
  doctorName?: string;
  department?: string;
  status: 'completed' | 'upcoming' | 'action_required' | 'cancelled';
  summary: string;
  details?: string;
  keyMetrics?: Array<{ label: string; value: string }>;
  actionLabel?: string;
  actionUrl?: string;
}
