import {
  Shift,
  Ambulance,
  Crew,
  Mission,
  Incident,
  Hospital,
  PatientEncounter,
  VitalSigns,
  CareEvent,
  HospitalPreAlert,
  Handover,
  MissionCompletion,
  SyncRecord,
  StaffMember,
  MissionStatus
} from './emsTypes'

const mockLead: StaffMember = {
  id: 'STF-8801',
  name: 'Rajesh Kumar',
  role: 'CREW_LEAD',
  badgeNumber: 'EMS-PAR-904',
  phone: '+91 98765 43210',
  certificationLevel: 'Advanced EMT-P',
}

const mockDriver: StaffMember = {
  id: 'STF-8802',
  name: 'Vikram Singh',
  role: 'AMBULANCE_DRIVER',
  badgeNumber: 'EMS-DRV-102',
  phone: '+91 98765 43211',
  certificationLevel: 'EVOC Certified Lead',
}

const mockCrew: Crew = {
  lead: mockLead,
  driver: mockDriver,
  stationId: 'STN-CENTRAL-01',
  stationName: 'Balaji Central Dispatch Unit',
}

const mockAmbulance: Ambulance = {
  id: 'AMB-108-ALS',
  vehicleNumber: 'MH-12-EM-9988',
  callSign: 'BALAJI-ALPHA-1',
  type: 'ALS',
  fuelLevelPercent: 92,
  oxygenLevelPercent: 88,
  equipmentStatus: 'READY',
  currentMileage: 42150,
  readiness: {
    oxygenPressurePsi: 2000,
    defibrillatorBatteryPercent: 100,
    stretcherFunctional: true,
    firstAidKitStocked: true,
    fuelLevelPercent: 92,
    suctionFunctional: true,
    medicationsChecked: true,
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  },
}

let activeShift: Shift | null = {
  id: 'SHF-2026-0724',
  staffId: mockLead.id,
  ambulanceId: mockAmbulance.id,
  startTime: new Date(Date.now() - 7200000).toISOString(),
  status: 'ON_DUTY',
  crew: mockCrew,
  ambulance: mockAmbulance,
  readinessCompleted: true,
}

const mockIncident: Incident = {
  id: 'INC-2026-9901',
  callerName: 'Sunita Sharma',
  callerPhone: '+91 98111 22334',
  chiefComplaint: 'Severe Acute Chest Pain & Severe Dyspnea',
  location: {
    address: 'Flat 402, Shivam Heights, MG Road, Sector 4',
    landmark: 'Opposite Central Park Gate 2',
    city: 'Mumbai Suburban',
    latitude: 19.076,
    longitude: 72.8777,
    accessInstructions: 'Elevator active. Park in Visitor Bay 3.',
  },
  priority: 1,
  priorityCode: 'P1',
  dispatcherNotes: '58y male, history of CAD. Diaphoretic, radiating pain to jaw.',
  reportedAt: new Date(Date.now() - 600000).toISOString(),
  patientAgeGender: '58 / Male',
  estimatedDistanceKm: 3.8,
  estimatedDriveMinutes: 7,
}

let activeMission: Mission | null = {
  id: 'MIS-2026-0042',
  incident: mockIncident,
  status: 'ASSIGNED',
  ambulance: mockAmbulance,
  crew: mockCrew,
  assignedAt: new Date(Date.now() - 300000).toISOString(),
  encounter: {
    id: 'ENC-9901',
    incidentId: 'INC-2026-9901',
    patient: {
      fullName: 'Ramesh Sharma',
      gender: 'MALE',
      ageYears: 58,
      phone: '+91 98111 22334',
      unknownIdentity: false,
      emergencyContactName: 'Sunita Sharma (Wife)',
      emergencyContactPhone: '+91 98111 22334',
    },
    initialVitals: {
      timestamp: new Date(Date.now() - 240000).toISOString(),
      bloodPressureSystolic: 154,
      bloodPressureDiastolic: 96,
      pulseRateBpm: 112,
      respiratoryRate: 24,
      spo2Percent: 91,
      bodyTempCelsius: 37.1,
      gcsTotal: 15,
      painScale10: 9,
      notes: 'Patient diaphoretic, chest discomfort 9/10.',
    },
    vitalsHistory: [],
    careEvents: [
      {
        id: 'CE-01',
        timestamp: new Date(Date.now() - 200000).toISOString(),
        category: 'OXYGEN',
        title: 'High-Flow Oxygen Therapy',
        dosageDetails: '12 Liters/min via Non-Rebreather Mask',
        performedByStaffId: mockLead.id,
        notes: 'SpO2 improved from 91% to 98%',
      },
    ],
    primaryImpression: 'Acute Coronary Syndrome (STEMI Suspected)',
    allergies: 'Penicillin',
    currentMedications: 'Aspirin 75mg OD, Atorvastatin 20mg',
    pastHistory: 'Hypertension, Type-2 Diabetes',
    sceneSafetyConfirmed: true,
    hazardsReported: [],
    patientFound: true,
  },
}

export const mockHospitals: Hospital[] = [
  {
    id: 'HOSP-01',
    name: 'Balaji Apex Tertiary Hospital & Cardiac Center',
    type: 'PRIVATE_MULTI',
    address: '108 Healthcare Blvd, Central Zone, Mumbai',
    distanceKm: 4.2,
    driveMinutes: 9,
    icuBedsAvailable: 4,
    emergencyStatus: 'OPEN',
    traumaLevel: 'LEVEL_1',
    phone: '+91 22 2890 0000',
    latitude: 19.0825,
    longitude: 72.8800,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Balaji+Heart+Center+Hospital+Mumbai',
    specialties: ['Cardiology', 'STEMI Cath Lab', '24/7 Cardiac Surgery', 'Trauma ICU'],
  },
  {
    id: 'HOSP-02',
    name: 'Government District Medical Center',
    type: 'GOVT_TERTIARY',
    address: 'Station Road, Sector 12, Suburb East',
    distanceKm: 6.5,
    driveMinutes: 14,
    icuBedsAvailable: 1,
    emergencyStatus: 'BUSY',
    traumaLevel: 'LEVEL_2',
    phone: '+91 22 2500 1122',
    latitude: 19.0650,
    longitude: 72.8920,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=District+Government+Medical+Center',
    specialties: ['General Surgery', 'Burn Unit', 'Dialysis', 'Pediatric ICU'],
  },
  {
    id: 'HOSP-03',
    name: 'City Care Emergency Hospital',
    type: 'TRAUMA_CENTER',
    address: 'East Bypass Avenue, Metro Zone',
    distanceKm: 8.1,
    driveMinutes: 18,
    icuBedsAvailable: 6,
    emergencyStatus: 'OPEN',
    traumaLevel: 'LEVEL_1',
    phone: '+91 22 2777 8888',
    latitude: 19.0910,
    longitude: 72.8650,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=City+Care+Emergency+Hospital',
    specialties: ['Trauma ICU', 'Orthopedic Surgery', 'Blood Bank', 'Stroke Center'],
  },
]

const mockHistoryMissions: Mission[] = [
  {
    id: 'MIS-2026-0039',
    incident: {
      ...mockIncident,
      id: 'INC-2026-9890',
      chiefComplaint: 'Motor Vehicle Collision - Multiple Injuries',
      priority: 1,
      priorityCode: 'P1',
      reportedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    status: 'COMPLETED',
    ambulance: mockAmbulance,
    crew: mockCrew,
    assignedAt: new Date(Date.now() - 90000000).toISOString(),
    completedAt: new Date(Date.now() - 85000000).toISOString(),
  },
  {
    id: 'MIS-2026-0035',
    incident: {
      ...mockIncident,
      id: 'INC-2026-9870',
      chiefComplaint: 'High Grade Fever & Dehydration',
      priority: 3,
      priorityCode: 'P3',
      reportedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    status: 'COMPLETED',
    ambulance: mockAmbulance,
    crew: mockCrew,
    assignedAt: new Date(Date.now() - 175000000).toISOString(),
    completedAt: new Date(Date.now() - 170000000).toISOString(),
  },
]

export const emsMockApi = {
  async getShift(): Promise<Shift | null> {
    await new Promise((r) => setTimeout(r, 150))
    return activeShift
  },

  async startShift(readiness: any): Promise<Shift> {
    await new Promise((r) => setTimeout(r, 250))
    activeShift = {
      id: `SHF-${Date.now()}`,
      staffId: mockLead.id,
      ambulanceId: mockAmbulance.id,
      startTime: new Date().toISOString(),
      status: 'ON_DUTY',
      crew: mockCrew,
      ambulance: {
        ...mockAmbulance,
        readiness: { ...readiness, completedAt: new Date().toISOString() },
      },
      readinessCompleted: true,
    }
    return activeShift
  },

  async getActiveMission(): Promise<Mission | null> {
    await new Promise((r) => setTimeout(r, 150))
    return activeMission
  },

  async updateMissionStatus(status: MissionStatus, extraData: any = {}): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission) throw new Error('No active mission')
    activeMission = {
      ...activeMission,
      status,
      ...extraData,
    }
    return activeMission!
  },

  async acknowledgeMission(incidentId: string): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission) throw new Error('No assigned mission')
    activeMission.status = 'EN_ROUTE'
    activeMission.enRouteAt = new Date().toISOString()
    return activeMission
  },

  async declineMission(reason: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 250))
    if (activeMission) {
      activeMission.status = 'UNABLE_TO_RESPOND'
      activeMission.unableToRespondReason = reason
      activeMission = null
    }
  },

  async confirmArrivalOnScene(): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission) throw new Error('No active mission')
    activeMission.status = 'ON_SCENE'
    activeMission.arrivedOnSceneAt = new Date().toISOString()
    return activeMission
  },

  async saveSceneSafety(safe: boolean, hazards: string[] = []): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission || !activeMission.encounter) throw new Error('No patient encounter')
    activeMission.encounter.sceneSafetyConfirmed = safe
    activeMission.encounter.hazardsReported = hazards
    if (safe) {
      activeMission.status = 'PATIENT_CARE'
    } else {
      activeMission.status = 'SCENE_UNSAFE'
    }
    return activeMission
  },

  async addVitals(vitals: VitalSigns): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission || !activeMission.encounter) throw new Error('No encounter')
    activeMission.encounter.vitalsHistory.push(vitals)
    return activeMission
  },

  async addCareEvent(care: CareEvent): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 250))
    if (!activeMission || !activeMission.encounter) throw new Error('No encounter')
    activeMission.encounter.careEvents.push(care)
    return activeMission
  },

  async getHospitals(): Promise<Hospital[]> {
    await new Promise((r) => setTimeout(r, 150))
    return mockHospitals
  },

  async selectHospitalAndSendPreAlert(
    hospitalId: string,
    specialNeeds: string[]
  ): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 300))
    const hosp = mockHospitals.find((h) => h.id === hospitalId) || mockHospitals[0]
    if (!activeMission) throw new Error('No active mission')

    const preAlert: HospitalPreAlert = {
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      etaMinutes: hosp.driveMinutes,
      chiefComplaint: activeMission.incident.chiefComplaint,
      patientCategory: activeMission.incident.priority === 1 ? 'RED' : 'YELLOW',
      specialNeeds,
      sentAt: new Date().toISOString(),
      status: 'ACKNOWLEDGED',
    }

    activeMission.destinationHospital = hosp
    activeMission.preAlert = preAlert
    activeMission.status = 'TRANSPORTING'
    activeMission.transportStartedAt = new Date().toISOString()

    return activeMission
  },

  async completeHandover(handover: Handover): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 300))
    if (!activeMission) throw new Error('No active mission')
    activeMission.handover = handover
    activeMission.status = 'HANDOVER'
    activeMission.arrivedAtHospitalAt = new Date().toISOString()
    return activeMission
  },

  async completeMission(completion: MissionCompletion): Promise<Mission> {
    await new Promise((r) => setTimeout(r, 300))
    if (!activeMission) throw new Error('No active mission')
    activeMission.completion = completion
    activeMission.status = 'COMPLETED'
    activeMission.completedAt = new Date().toISOString()

    const completed: Mission = { ...activeMission }
    mockHistoryMissions.unshift(completed)
    activeMission = null
    return completed
  },

  async resetMissionToAvailable(): Promise<void> {
    activeMission = null
  },

  async getHistory(): Promise<Mission[]> {
    await new Promise((r) => setTimeout(r, 150))
    return mockHistoryMissions
  },

  async getSyncStatus(): Promise<SyncRecord[]> {
    await new Promise((r) => setTimeout(r, 100))
    return [
      {
        id: 'SYNC-101',
        entityType: 'VITALS',
        entityId: 'V-9901-01',
        action: 'CREATE',
        data: {},
        queuedAt: new Date(Date.now() - 120000).toISOString(),
        status: 'SYNCED',
        retryCount: 0,
      },
    ]
  },
}
