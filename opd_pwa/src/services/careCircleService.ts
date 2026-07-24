import { simulateLatency } from './apiClient';
import { CareMember, JourneyEvent } from '../types';

export const MOCK_CARE_MEMBERS: CareMember[] = [
  {
    id: 'pat-101',
    fullName: 'Rajesh K. Sharma',
    relationship: 'myself',
    relationshipLabel: 'Myself',
    age: 42,
    gender: 'male',
    mrn: 'MR-2026-8842',
    avatarInitials: 'RS',
    isPrimaryAccountHolder: true,
    bloodGroup: 'B+',
    emergencyContact: '+919876543210',
    activeStatus: 'stable',
    activeStatusText: 'Stable • Annual Checkup Scheduled',
    activeAppointmentsCount: 1,
    activePrescriptionsCount: 2,
    lastVitals: {
      bloodPressure: '122/80',
      heartRate: 72,
      spo2: 99,
      temperature: '98.4°F',
      lastUpdated: 'Today, 9:00 AM',
    },
    accessPermission: 'full_access',
  },
  {
    id: 'pat-102',
    fullName: 'Suresh Kumar Sharma',
    relationship: 'father',
    relationshipLabel: 'Father',
    age: 68,
    gender: 'male',
    mrn: 'MR-2024-1102',
    avatarInitials: 'SK',
    bloodGroup: 'O+',
    emergencyContact: '+919876543210',
    activeStatus: 'followup_due',
    activeStatusText: 'Post-Hypertension Review Due',
    activeAppointmentsCount: 1,
    activePrescriptionsCount: 3,
    lastVitals: {
      bloodPressure: '138/88',
      heartRate: 78,
      spo2: 97,
      temperature: '98.6°F',
      lastUpdated: 'Yesterday, 6:30 PM',
    },
    accessPermission: 'full_access',
  },
  {
    id: 'pat-103',
    fullName: 'Meena Devi Sharma',
    relationship: 'mother',
    relationshipLabel: 'Mother',
    age: 64,
    gender: 'female',
    mrn: 'MR-2024-1103',
    avatarInitials: 'MS',
    bloodGroup: 'A+',
    emergencyContact: '+919876543210',
    activeStatus: 'lab_ready',
    activeStatusText: 'Lipid Profile Lab Results Ready',
    activeAppointmentsCount: 0,
    activePrescriptionsCount: 1,
    lastVitals: {
      bloodPressure: '126/82',
      heartRate: 74,
      spo2: 98,
      temperature: '98.2°F',
      lastUpdated: '2 days ago',
    },
    accessPermission: 'full_access',
  },
  {
    id: 'pat-104',
    fullName: 'Aarav Kumar Sharma',
    relationship: 'child',
    relationshipLabel: 'Child (Son)',
    age: 8,
    gender: 'male',
    mrn: 'MR-2025-4491',
    avatarInitials: 'AS',
    bloodGroup: 'B+',
    emergencyContact: '+919876543210',
    activeStatus: 'stable',
    activeStatusText: 'Pediatric Cardiac Screening Completed',
    activeAppointmentsCount: 0,
    activePrescriptionsCount: 1,
    lastVitals: {
      bloodPressure: '105/70',
      heartRate: 88,
      spo2: 100,
      temperature: '98.6°F',
      lastUpdated: '3 days ago',
    },
    accessPermission: 'full_access',
  },
];

export const MOCK_JOURNEY_EVENTS: Record<string, JourneyEvent[]> = {
  'pat-101': [
    {
      id: 'ev-101-1',
      patientId: 'pat-101',
      title: 'Cardiology Consultation Confirmed',
      subtitle: 'Dr. Ananya Rao • Balaji Heart Center OPD Room 03',
      date: '2026-07-24',
      time: '10:30 AM',
      category: 'appointment',
      doctorName: 'Dr. Ananya Rao',
      department: 'Cardiology',
      status: 'upcoming',
      summary: 'Follow-up consultation for routine cardiac risk evaluation and medication review.',
      actionLabel: 'View Appointment',
      actionUrl: '/appointments/apt-501',
    },
    {
      id: 'ev-101-2',
      patientId: 'pat-101',
      title: 'Prescription Issued',
      subtitle: 'Dr. Ananya Rao • 2 Medicines Prescribed',
      date: '2026-07-10',
      category: 'prescription',
      doctorName: 'Dr. Ananya Rao',
      department: 'Cardiology',
      status: 'completed',
      summary: 'Atorvastatin 20mg & Metoprolol 50mg continuation therapy.',
      keyMetrics: [
        { label: 'Atorvastatin', value: '20mg OD (Dinner)' },
        { label: 'Metoprolol', value: '50mg BD' },
      ],
      actionLabel: 'View Prescription',
      actionUrl: '/prescriptions/rx-701',
    },
    {
      id: 'ev-101-3',
      patientId: 'pat-101',
      title: 'Comprehensive Lipid & Troponin-I Panel',
      subtitle: 'Balaji Central Diagnostics Lab',
      date: '2026-07-08',
      category: 'lab_report',
      status: 'completed',
      summary: 'Total Cholesterol: 185 mg/dL (Normal). Troponin-I: < 0.01 ng/mL (Normal).',
      keyMetrics: [
        { label: 'Total Cholesterol', value: '185 mg/dL' },
        { label: 'HDL / LDL', value: '48 / 112 mg/dL' },
        { label: 'Troponin-I', value: '< 0.01 ng/mL' },
      ],
      actionLabel: 'Download Report',
      actionUrl: '/records/labs/rep-901',
    },
    {
      id: 'ev-101-4',
      patientId: 'pat-101',
      title: '12-Lead Resting ECG & Vitals Check-in',
      subtitle: 'Triage Nurse Desk',
      date: '2026-06-15',
      category: 'vital',
      status: 'completed',
      summary: 'Normal sinus rhythm, HR 72 bpm, BP 122/80 mmHg. No arrhythmia noted.',
      keyMetrics: [
        { label: 'BP', value: '122/80 mmHg' },
        { label: 'Heart Rate', value: '72 bpm' },
        { label: 'ECG Rhythm', value: 'Normal Sinus' },
      ],
    },
  ],
  'pat-102': [
    {
      id: 'ev-102-1',
      patientId: 'pat-102',
      title: 'Hypertension Special Clinic Appointment',
      subtitle: 'Dr. Vikramaditya • Room 07',
      date: '2026-07-28',
      time: '04:00 PM',
      category: 'appointment',
      doctorName: 'Dr. Vikramaditya',
      department: 'Hypertension & Vascular Health',
      status: 'upcoming',
      summary: 'Bi-monthly blood pressure adjustment and renal safety panel review.',
      actionLabel: 'View Details',
      actionUrl: '/appointments/apt-502',
    },
    {
      id: 'ev-102-2',
      patientId: 'pat-102',
      title: 'Ambulatory 24hr BP Monitoring Report',
      subtitle: 'Vascular Diagnostics Dept',
      date: '2026-07-15',
      category: 'lab_report',
      status: 'action_required',
      summary: 'Systolic mean 138 mmHg. Mild nocturnal dipping preserved. Recommendation to review Telmisartan dose.',
      keyMetrics: [
        { label: 'Mean Day BP', value: '138/88 mmHg' },
        { label: 'Mean Night BP', value: '124/76 mmHg' },
      ],
      actionLabel: 'Review Report',
      actionUrl: '/records/labs/rep-902',
    },
    {
      id: 'ev-102-3',
      patientId: 'pat-102',
      title: '2D Echocardiogram Screening',
      subtitle: 'Balaji Cardiac Imaging Wing',
      date: '2026-05-20',
      category: 'lab_report',
      status: 'completed',
      summary: 'Ejection Fraction 62%. Concentric LV hypertrophy mild. Normal valvular velocities.',
      keyMetrics: [
        { label: 'LVEF', value: '62%' },
        { label: 'LV Wall', value: 'Mild Hypertrophy' },
      ],
    },
  ],
  'pat-103': [
    {
      id: 'ev-103-1',
      patientId: 'pat-103',
      title: 'Lipid Profile & HbA1c Lab Report Ready',
      subtitle: 'Balaji Central Lab',
      date: '2026-07-21',
      category: 'lab_report',
      status: 'completed',
      summary: 'HbA1c: 6.2% (Well controlled). LDL: 95 mg/dL. Triglycerides: 140 mg/dL.',
      keyMetrics: [
        { label: 'HbA1c', value: '6.2%' },
        { label: 'LDL', value: '95 mg/dL' },
      ],
      actionLabel: 'View Lab Report',
      actionUrl: '/records/labs/rep-903',
    },
    {
      id: 'ev-103-2',
      patientId: 'pat-103',
      title: 'Preventive Cardiology Consultation',
      subtitle: 'Dr. Meenakshi Sundaram',
      date: '2026-06-10',
      category: 'appointment',
      doctorName: 'Dr. Meenakshi Sundaram',
      department: 'Preventive Cardiology',
      status: 'completed',
      summary: 'Dietary guidance provided. Advised continuation of Rosuvastatin 10mg.',
    },
  ],
  'pat-104': [
    {
      id: 'ev-104-1',
      patientId: 'pat-104',
      title: 'Pediatric Cardiac Clearance Certificate',
      subtitle: 'Dr. Rajiv Menon • Pediatric Cardiology',
      date: '2026-07-05',
      category: 'appointment',
      doctorName: 'Dr. Rajiv Menon',
      department: 'Pediatric Cardiology',
      status: 'completed',
      summary: 'Annual sports fitness clearance given. Innocent murmur ruled non-pathological.',
      keyMetrics: [
        { label: 'Clearance Status', value: 'Fit for all activities' },
        { label: 'ECG', value: 'Normal' },
      ],
    },
  ],
};

export const careCircleService = {
  getCareMembers: async (): Promise<CareMember[]> => {
    const result = await simulateLatency(MOCK_CARE_MEMBERS, 300);
    return result.data;
  },

  getPatientJourney: async (patientId: string): Promise<JourneyEvent[]> => {
    const events = MOCK_JOURNEY_EVENTS[patientId] || MOCK_JOURNEY_EVENTS['pat-101'];
    const result = await simulateLatency(events, 400);
    return result.data;
  },

  addCareMember: async (newMemberData: Partial<CareMember>): Promise<CareMember> => {
    const id = `pat-${Math.floor(100 + Math.random() * 900)}`;
    const initials = newMemberData.fullName
      ? newMemberData.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'FM';

    const created: CareMember = {
      id,
      fullName: newMemberData.fullName || 'Family Member',
      relationship: newMemberData.relationship || 'other',
      relationshipLabel: newMemberData.relationshipLabel || 'Family Member',
      age: newMemberData.age || 30,
      gender: newMemberData.gender || 'male',
      mrn: `MR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      avatarInitials: initials,
      bloodGroup: newMemberData.bloodGroup || 'B+',
      emergencyContact: newMemberData.emergencyContact || '+919876543210',
      activeStatus: 'stable',
      activeStatusText: 'Newly Linked • Records Synced',
      activeAppointmentsCount: 0,
      activePrescriptionsCount: 0,
      lastVitals: {
        bloodPressure: '120/80',
        heartRate: 72,
        spo2: 98,
        lastUpdated: 'Just now',
      },
      accessPermission: 'full_access',
    };

    MOCK_CARE_MEMBERS.push(created);
    MOCK_JOURNEY_EVENTS[id] = [
      {
        id: `ev-${id}-1`,
        patientId: id,
        title: 'Care Circle Profile Created & Linked',
        subtitle: 'Balaji Heart Center Patient Portal',
        date: new Date().toISOString().split('T')[0],
        category: 'vital',
        status: 'completed',
        summary: `Authorized profile established for ${created.fullName}. Medical history access synced.`,
      },
    ];

    const result = await simulateLatency(created, 500);
    return result.data;
  },
};
