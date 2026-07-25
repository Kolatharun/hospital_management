export type MissionPriority = 1 | 2 | 3 | 4

export type PriorityCode = 'P1' | 'P2' | 'P3' | 'P4'

export type MissionStatus =
  | "OFF_DUTY"
  | "READINESS_REQUIRED"
  | "AVAILABLE"
  | "ALERTING"
  | "ASSIGNED"
  | "ACKNOWLEDGED"
  | "EN_ROUTE"
  | "ON_SCENE"
  | "PATIENT_CARE"
  | "DESTINATION_SELECTED"
  | "TRANSPORTING"
  | "HANDOVER"
  | "RESET_REQUIRED"
  | "COMPLETED"
  | "UNABLE_TO_RESPOND"
  | "SCENE_UNSAFE"
  | "UNABLE_TO_LOCATE"
  | "UNABLE_TO_ACCESS"
  | "NO_PATIENT_FOUND"
  | "MULTIPLE_PATIENTS"
  | "PATIENT_REFUSED"
  | "TREATED_ON_SCENE"
  | "TRANSFERRED"
  | "CANCELLED"
  | "OFFLINE_SYNC_PENDING"

export interface StaffMember {
  id: string
  name: string
  role: 'EMT_PARAMEDIC' | 'EMT_BASIC' | 'AMBULANCE_DRIVER' | 'CREW_LEAD'
  badgeNumber: string
  phone: string
  avatarUrl?: string
  certificationLevel: string
}

export interface Crew {
  lead: StaffMember
  driver: StaffMember
  paramedic?: StaffMember
  stationId: string
  stationName: string
}

export interface AmbulanceReadinessCheck {
  oxygenPressurePsi: number
  defibrillatorBatteryPercent: number
  stretcherFunctional: boolean
  firstAidKitStocked: boolean
  fuelLevelPercent: number
  suctionFunctional: boolean
  medicationsChecked: boolean
  notes?: string
  completedAt?: string
}

export interface Ambulance {
  id: string
  vehicleNumber: string
  callSign: string
  type: 'ALS' | 'BLS' | 'CRITICAL_CARE'
  fuelLevelPercent: number
  oxygenLevelPercent: number
  equipmentStatus: 'READY' | 'ATTENTION_NEEDED' | 'OUT_OF_SERVICE'
  currentMileage: number
  readiness: AmbulanceReadinessCheck
}

export interface Shift {
  id: string
  staffId: string
  ambulanceId: string
  startTime: string
  endTime?: string
  status: 'CHECKED_IN' | 'ON_DUTY' | 'ON_BREAK' | 'COMPLETED'
  crew: Crew
  ambulance: Ambulance
  readinessCompleted: boolean
}

export interface IncidentLocation {
  address: string
  landmark?: string
  city: string
  latitude: number
  longitude: number
  accessInstructions?: string
}

export interface Incident {
  id: string
  callerName: string
  callerPhone: string
  chiefComplaint: string
  location: IncidentLocation
  priority: MissionPriority
  priorityCode: PriorityCode
  dispatcherNotes?: string
  reportedAt: string
  patientAgeGender?: string
  estimatedDistanceKm: number
  estimatedDriveMinutes: number
}

export interface PatientIdentity {
  id?: string
  fullName: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'
  ageYears?: number
  dob?: string
  phone?: string
  uhid?: string // Hospital ID if known
  emergencyContactName?: string
  emergencyContactPhone?: string
  unknownIdentity: boolean
}

export interface VitalSigns {
  timestamp: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  pulseRateBpm?: number
  respiratoryRate?: number
  spo2Percent?: number
  bodyTempCelsius?: number
  gcsTotal?: number // Glasgow Coma Scale 3-15
  bloodGlucoseMgDl?: number
  painScale10?: number
  notes?: string
}

export interface CareEvent {
  id: string
  timestamp: string
  category: 'OXYGEN' | 'MEDICATION' | 'IV_FLUIDS' | 'ECG' | 'CPR' | 'AIRWAY' | 'SPLINT' | 'OTHER'
  title: string
  dosageDetails?: string
  performedByStaffId: string
  notes?: string
}

export interface PatientEncounter {
  id: string
  incidentId: string
  patient: PatientIdentity
  initialVitals: VitalSigns
  vitalsHistory: VitalSigns[]
  careEvents: CareEvent[]
  primaryImpression: string
  allergies?: string
  currentMedications?: string
  pastHistory?: string
  sceneSafetyConfirmed: boolean
  hazardsReported: string[]
  patientFound: boolean
}

export interface Hospital {
  id: string
  name: string
  type: 'GOVT_TERTIARY' | 'PRIVATE_MULTI' | 'TRAUMA_CENTER' | 'DISTRICT_HOSPITAL'
  address: string
  distanceKm: number
  driveMinutes: number
  icuBedsAvailable: number
  emergencyStatus: 'OPEN' | 'BUSY' | 'DIVERTED'
  traumaLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
  phone: string
  latitude?: number
  longitude?: number
  googleMapsUrl?: string
  specialties?: string[]
}

export interface HospitalPreAlert {
  hospitalId: string
  hospitalName: string
  etaMinutes: number
  chiefComplaint: string
  patientCategory: 'RED' | 'YELLOW' | 'GREEN'
  specialNeeds: string[]
  sentAt: string
  status: 'SENT' | 'ACKNOWLEDGED' | 'BED_RESERVED'
}

export interface Handover {
  hospitalId: string
  receivingDoctorName: string
  receivingNurseName: string
  doctorRegistrationNo?: string
  handoverTime: string
  vitalSignsAtHandover: VitalSigns
  belongingsHandedOver: boolean
  handoverNotes?: string
  signatureCaptured: boolean
}

export interface MissionCompletion {
  completedAt: string
  totalDistanceKm: number
  outcome: 'PATIENT_DELIVERED' | 'PATIENT_REFUSED' | 'PATIENT_DECEASED' | 'CANCELLED_EN_ROUTE' | 'NO_PATIENT_LOCATED'
  summaryNotes: string
  vehicleCleanedAndRestocked: boolean
}

export interface Mission {
  id: string
  incident: Incident
  status: MissionStatus
  ambulance: Ambulance
  crew: Crew
  encounter?: PatientEncounter
  destinationHospital?: Hospital
  preAlert?: HospitalPreAlert
  handover?: Handover
  completion?: MissionCompletion
  assignedAt: string
  enRouteAt?: string
  arrivedOnSceneAt?: string
  transportStartedAt?: string
  arrivedAtHospitalAt?: string
  completedAt?: string
  unableToRespondReason?: string
}

export interface TimelineEvent {
  id: string
  timestamp: string
  status: MissionStatus
  title: string
  description: string
  actor: string
}

export interface SyncRecord {
  id: string
  entityType: 'MISSION' | 'VITALS' | 'CARE_EVENT' | 'HANDOVER'
  entityId: string
  action: 'UPDATE' | 'CREATE'
  data: any
  queuedAt: string
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED'
  retryCount: number
  errorMessage?: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  reducedMotion: boolean
  offlineModeForced: boolean
  soundAlertsEnabled: boolean
}

export interface APIError {
  message: string
  code: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}
