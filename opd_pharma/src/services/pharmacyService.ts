import { api } from './api';
import {
  PrescriptionRequest,
  DrugStockItem,
  DispenseLog,
  QueueMetrics,
  PharmacistProfile,
  QueueStatus,
} from '../types/pharmacy';

const QUEUE_STORAGE_KEY = 'bhc_opd_pharma_queue_v1';
const STOCK_STORAGE_KEY = 'bhc_opd_pharma_stock_v1';
const HISTORY_STORAGE_KEY = 'bhc_opd_pharma_history_v1';

function getStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Mock Initial Data for Standalone Desktop Application & Testing
const INITIAL_QUEUE_REQUESTS: PrescriptionRequest[] = [
  {
    id: 'req-101',
    appointment_id: 'apt-901',
    token_number: 104,
    patient: {
      id: 'pat-001',
      mr_number: 'BHC-2026-8891',
      op_number: 'OPD-10492',
      full_name: 'Rajesh Kumar Verma',
      age: 58,
      gender: 'Male',
      phone: '+91 98765 43210',
      blood_group: 'O+',
      allergies: [
        { allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis / Rash' },
      ],
      weight_kg: 74,
      vitals: { bp: '135/88', pulse: 76, sp02: 98 },
    },
    doctor: {
      id: 'doc-12',
      full_name: 'Dr. V. K. Sharma',
      department: 'Cardiology',
      qualification: 'MD, DM (Cardiology)',
      registration_number: 'MCI-48912',
    },
    status: 'pending',
    priority: 'stat',
    payment_status: 'paid',
    diagnosis: 'Hypertension Stage II, Ischemic Heart Disease',
    clinical_notes: 'Patient experiences mild dyspnea on exertion. Continue beta blockers.',
    medicines: [
      {
        id: 'med-01',
        medicine_name: 'Tab. Telmisartan 40mg',
        generic_name: 'Telmisartan',
        dosage: '1 tab',
        frequency: '1-0-0 (Morning after food)',
        duration: '30 Days',
        instructions: 'Take after breakfast with water',
        prescribed_qty: 30,
        available_qty: 120,
        unit_price: 6.5,
        stock_status: 'in_stock',
        batch_number: 'TEL-2026-B9',
        expiry_date: '2027-11-30',
        rack_location: 'Rack A-02',
      },
      {
        id: 'med-02',
        medicine_name: 'Tab. Clopidogrel 75mg',
        generic_name: 'Clopidogrel',
        dosage: '1 tab',
        frequency: '0-0-1 (Night)',
        duration: '30 Days',
        instructions: 'Do not miss dosage',
        prescribed_qty: 30,
        available_qty: 85,
        unit_price: 12.0,
        stock_status: 'in_stock',
        batch_number: 'CLO-2026-A1',
        expiry_date: '2027-08-15',
        rack_location: 'Rack B-05',
      },
      {
        id: 'med-03',
        medicine_name: 'Tab. Atorvastatin 20mg',
        generic_name: 'Atorvastatin',
        dosage: '1 tab',
        frequency: '0-0-1 (Night)',
        duration: '30 Days',
        instructions: 'Take after dinner',
        prescribed_qty: 30,
        available_qty: 8,
        unit_price: 15.0,
        stock_status: 'low_stock',
        batch_number: 'ATO-2025-Z4',
        expiry_date: '2026-10-10',
        rack_location: 'Rack A-08',
        substitute_options: [
          {
            id: 'sub-01',
            brand_name: 'Tab. Lipitor 20mg',
            generic_name: 'Atorvastatin Calcium',
            available_qty: 60,
            unit_price: 18.0,
          },
        ],
      },
    ],
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    total_amount: 1005.0,
  },
  {
    id: 'req-102',
    appointment_id: 'apt-902',
    token_number: 105,
    patient: {
      id: 'pat-002',
      mr_number: 'BHC-2026-9012',
      op_number: 'OPD-10493',
      full_name: 'Sunita Reddy',
      age: 46,
      gender: 'Female',
      phone: '+91 94412 34567',
      blood_group: 'B+',
      allergies: [],
      weight_kg: 62,
      vitals: { bp: '120/80', pulse: 72, sp02: 99 },
    },
    doctor: {
      id: 'doc-08',
      full_name: 'Dr. Ananya Rao',
      department: 'General Medicine',
      qualification: 'MD (Internal Medicine)',
      registration_number: 'MCI-51203',
    },
    status: 'reviewing',
    priority: 'urgent',
    payment_status: 'paid',
    diagnosis: 'Type 2 Diabetes Mellitus, Mild Neuropathy',
    clinical_notes: 'Fasting Blood Sugar 142 mg/dL. Adjusting Metformin dosage.',
    medicines: [
      {
        id: 'med-04',
        medicine_name: 'Tab. Metformin 500mg SR',
        generic_name: 'Metformin Hydrochloride',
        dosage: '1 tab',
        frequency: '1-0-1 (Twice daily)',
        duration: '60 Days',
        instructions: 'Take immediately after meals',
        prescribed_qty: 120,
        available_qty: 350,
        unit_price: 3.2,
        stock_status: 'in_stock',
        batch_number: 'MET-2026-C3',
        expiry_date: '2028-02-28',
        rack_location: 'Rack C-01',
      },
      {
        id: 'med-05',
        medicine_name: 'Cap. Methylcobalamin 1500mcg',
        generic_name: 'Vitamin B12',
        dosage: '1 cap',
        frequency: '1-0-0 (Morning)',
        duration: '30 Days',
        instructions: 'Nutritional supplement',
        prescribed_qty: 30,
        available_qty: 140,
        unit_price: 9.0,
        stock_status: 'in_stock',
        batch_number: 'VIT-2026-X1',
        expiry_date: '2027-05-20',
        rack_location: 'Rack D-04',
      },
    ],
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    total_amount: 654.0,
  },
  {
    id: 'req-103',
    appointment_id: 'apt-903',
    token_number: 106,
    patient: {
      id: 'pat-003',
      mr_number: 'BHC-2026-7450',
      op_number: 'OPD-10494',
      full_name: 'Mohd. Imran Khan',
      age: 63,
      gender: 'Male',
      phone: '+91 98112 78901',
      blood_group: 'A+',
      allergies: [{ allergen: 'Sulfa Drugs', severity: 'moderate', reaction: 'Urticaria' }],
      weight_kg: 81,
    },
    doctor: {
      id: 'doc-12',
      full_name: 'Dr. V. K. Sharma',
      department: 'Cardiology',
      qualification: 'MD, DM (Cardiology)',
      registration_number: 'MCI-48912',
    },
    status: 'preparing',
    priority: 'routine',
    payment_status: 'paid',
    diagnosis: 'Angina Pectoris, Dyslipidemia',
    medicines: [
      {
        id: 'med-06',
        medicine_name: 'Tab. Nitroglycerin 2.6mg SR',
        generic_name: 'Glyceryl Trinitrate',
        dosage: '1 tab',
        frequency: '1-0-1',
        duration: '15 Days',
        instructions: 'Swallow whole, do not crush',
        prescribed_qty: 30,
        available_qty: 90,
        unit_price: 8.0,
        stock_status: 'in_stock',
        batch_number: 'NIT-2026-P9',
        expiry_date: '2027-04-12',
        rack_location: 'Rack A-05',
      },
      {
        id: 'med-07',
        medicine_name: 'Tab. Aspirin 75mg EC',
        generic_name: 'Acetylsalicylic Acid',
        dosage: '1 tab',
        frequency: '0-1-0 (After lunch)',
        duration: '30 Days',
        instructions: 'Take after heavy food',
        prescribed_qty: 30,
        available_qty: 210,
        unit_price: 2.5,
        stock_status: 'in_stock',
        batch_number: 'ASP-2026-M2',
        expiry_date: '2028-01-10',
        rack_location: 'Rack B-01',
      },
    ],
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    prepared_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    total_amount: 315.0,
  },
  {
    id: 'req-104',
    appointment_id: 'apt-904',
    token_number: 107,
    patient: {
      id: 'pat-004',
      mr_number: 'BHC-2026-6129',
      op_number: 'OPD-10495',
      full_name: 'Priya Sundaram',
      age: 39,
      gender: 'Female',
      phone: '+91 97234 56789',
      blood_group: 'O-',
      allergies: [],
    },
    doctor: {
      id: 'doc-08',
      full_name: 'Dr. Ananya Rao',
      department: 'General Medicine',
      qualification: 'MD (Internal Medicine)',
      registration_number: 'MCI-51203',
    },
    status: 'ready',
    priority: 'urgent',
    payment_status: 'paid',
    diagnosis: 'Acute Gastritis, Reflux Esophagitis',
    medicines: [
      {
        id: 'med-08',
        medicine_name: 'Cap. Pantoprazole 40mg + Domperidone 30mg',
        generic_name: 'Pantoprazole DSR',
        dosage: '1 cap',
        frequency: '1-0-0 (Before breakfast)',
        duration: '14 Days',
        instructions: 'Take 30 minutes before breakfast',
        prescribed_qty: 14,
        available_qty: 180,
        unit_price: 11.0,
        stock_status: 'in_stock',
        batch_number: 'PAN-2026-K1',
        expiry_date: '2027-09-30',
        rack_location: 'Rack C-04',
      },
    ],
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    prepared_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    ready_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    total_amount: 154.0,
  },
];

const INITIAL_STOCK_ITEMS: DrugStockItem[] = [
  {
    id: 'stk-01',
    brand_name: 'Tab. Telmisartan 40mg',
    generic_name: 'Telmisartan',
    category: 'Cardiology Special',
    dosage_form: 'Tablet',
    strength: '40 mg',
    manufacturer: 'Cipla Healthcare',
    rack_location: 'Rack A-02',
    total_stock: 120,
    reorder_level: 50,
    unit_price: 6.5,
    status: 'in_stock',
    batches: [
      { batch_number: 'TEL-2026-B9', expiry_date: '2027-11-30', quantity: 120, mfg_date: '2025-11-01' },
    ],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stk-02',
    brand_name: 'Tab. Atorvastatin 20mg',
    generic_name: 'Atorvastatin',
    category: 'Cardiology Special',
    dosage_form: 'Tablet',
    strength: '20 mg',
    manufacturer: 'Sun Pharmaceutical',
    rack_location: 'Rack A-08',
    total_stock: 8,
    reorder_level: 40,
    unit_price: 15.0,
    status: 'low_stock',
    batches: [
      { batch_number: 'ATO-2025-Z4', expiry_date: '2026-10-10', quantity: 8, mfg_date: '2024-10-01' },
    ],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stk-03',
    brand_name: 'Tab. Metformin 500mg SR',
    generic_name: 'Metformin Hydrochloride',
    category: 'Tablets',
    dosage_form: 'Sustained Release Tablet',
    strength: '500 mg',
    manufacturer: 'USV Ltd.',
    rack_location: 'Rack C-01',
    total_stock: 350,
    reorder_level: 100,
    unit_price: 3.2,
    status: 'in_stock',
    batches: [
      { batch_number: 'MET-2026-C3', expiry_date: '2028-02-28', quantity: 350, mfg_date: '2026-01-15' },
    ],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stk-04',
    brand_name: 'Inj. Enoxaparin 60mg',
    generic_name: 'Enoxaparin Sodium',
    category: 'Injections',
    dosage_form: 'Pre-filled Syringe',
    strength: '60 mg / 0.6 ml',
    manufacturer: 'Sanofi India',
    rack_location: 'Cold Storage Ref-2',
    total_stock: 15,
    reorder_level: 20,
    unit_price: 680.0,
    status: 'expiring_soon',
    batches: [
      { batch_number: 'ENO-2025-X2', expiry_date: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0], quantity: 15, mfg_date: '2024-08-01' },
    ],
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stk-05',
    brand_name: 'Tab. Amiodarone 200mg',
    generic_name: 'Amiodarone Hydrochloride',
    category: 'Cardiology Special',
    dosage_form: 'Tablet',
    strength: '200 mg',
    manufacturer: 'Torrent Pharmaceuticals',
    rack_location: 'Rack A-14',
    total_stock: 0,
    reorder_level: 30,
    unit_price: 24.5,
    status: 'out_of_stock',
    batches: [],
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_DISPENSE_HISTORY: DispenseLog[] = [
  {
    id: 'dsp-801',
    request_id: 'req-098',
    token_number: 101,
    mr_number: 'BHC-2026-4401',
    patient_name: 'Gopal Krishna',
    doctor_name: 'Dr. V. K. Sharma',
    items_count: 3,
    total_amount: 890.0,
    payment_status: 'paid',
    dispensed_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    dispensed_by: 'Pharmacist Ramesh P. (Reg #PH-9912)',
    medicines_summary: ['Telmisartan 40mg x 30', 'Aspirin 75mg x 30', 'Atorvastatin 10mg x 30'],
    status: 'completed',
  },
  {
    id: 'dsp-802',
    request_id: 'req-099',
    token_number: 102,
    mr_number: 'BHC-2026-3210',
    patient_name: 'Savitri Devi',
    doctor_name: 'Dr. Ananya Rao',
    items_count: 2,
    total_amount: 420.0,
    payment_status: 'paid',
    dispensed_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    dispensed_by: 'Pharmacist Ramesh P. (Reg #PH-9912)',
    medicines_summary: ['Pantoprazole 40mg x 14', 'Metformin 500mg x 60'],
    status: 'completed',
  },
];

let MOCK_QUEUE_REQUESTS: PrescriptionRequest[] = getStoredData(QUEUE_STORAGE_KEY, INITIAL_QUEUE_REQUESTS);
let MOCK_STOCK_ITEMS: DrugStockItem[] = getStoredData(STOCK_STORAGE_KEY, INITIAL_STOCK_ITEMS);
let MOCK_DISPENSE_HISTORY: DispenseLog[] = getStoredData(HISTORY_STORAGE_KEY, INITIAL_DISPENSE_HISTORY);

export const pharmacyService = {
  // 1. Fetch Queue Requests (Live endpoint with fallback to Mock)
  async getQueueRequests(): Promise<PrescriptionRequest[]> {
    MOCK_QUEUE_REQUESTS = getStoredData(QUEUE_STORAGE_KEY, INITIAL_QUEUE_REQUESTS);
    try {
      const liveData = await api.get<any[]>('/pharmacy-queue');
      if (Array.isArray(liveData) && liveData.length > 0) {
        return liveData.map((item) => ({
          id: item.id,
          appointment_id: item.appointment_id,
          token_number: item.token_number || 100,
          patient: {
            id: item.patient_id || 'pat-gen',
            mr_number: item.mr_number || 'BHC-2026-0000',
            op_number: item.op_number || 'OPD-0000',
            full_name: item.patient_name || 'Patient',
            age: 50,
            gender: 'Male',
            phone: '+91 99999 99999',
          },
          doctor: {
            id: 'doc-1',
            full_name: 'Dr. Duty Doctor',
            department: 'OPD',
            qualification: 'MBBS',
            registration_number: 'MCI-000',
          },
          status: item.status as QueueStatus,
          priority: 'routine',
          payment_status: 'paid',
          diagnosis: 'Prescription Evaluation',
          medicines: (item.medicines || []).map((m: string, idx: number) => ({
            id: `m-${idx}`,
            medicine_name: m,
            dosage: '1 tab',
            frequency: '1-0-1',
            duration: '10 Days',
            instructions: 'Take with water',
            prescribed_qty: 20,
            available_qty: 100,
            unit_price: 10,
            stock_status: 'in_stock',
          })),
          created_at: item.created_at || new Date().toISOString(),
          total_amount: 200,
        }));
      }
      return MOCK_QUEUE_REQUESTS;
    } catch {
      return MOCK_QUEUE_REQUESTS;
    }
  },

  async getRequestById(requestId: string): Promise<PrescriptionRequest> {
    const item = MOCK_QUEUE_REQUESTS.find((r) => r.id === requestId);
    if (!item) {
      throw new Error(`Pharmacy request ${requestId} not found.`);
    }
    return item;
  },

  // 2. Queue Status Transitions (PH-01 -> PH-02 -> PH-03 -> PH-04 -> PH-06)
  async updateQueueStatus(
    requestId: string,
    newStatus: QueueStatus,
    extraData?: {
      dispensed_by?: string;
      counseling_notes?: string;
      rejection_reason?: string;
      medicines?: any[];
    }
  ): Promise<PrescriptionRequest> {
    const index = MOCK_QUEUE_REQUESTS.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error('Request not found');
    }

    const current = MOCK_QUEUE_REQUESTS[index];
    const now = new Date().toISOString();

    const updated: PrescriptionRequest = {
      ...current,
      status: newStatus,
      reviewed_at: newStatus === 'reviewing' || newStatus === 'preparing' ? current.reviewed_at || now : current.reviewed_at,
      prepared_at: newStatus === 'ready' ? current.prepared_at || now : current.prepared_at,
      ready_at: newStatus === 'ready' ? current.ready_at || now : current.ready_at,
      dispensed_at: newStatus === 'completed' ? now : current.dispensed_at,
      counseling_notes: extraData?.counseling_notes || current.counseling_notes,
      rejection_reason: extraData?.rejection_reason || current.rejection_reason,
      dispensed_by: extraData?.dispensed_by || current.dispensed_by || 'Pharmacist Ramesh P.',
      medicines: extraData?.medicines || current.medicines,
    };

    MOCK_QUEUE_REQUESTS[index] = updated;

    // Save to localStorage persistence
    setStoredData(QUEUE_STORAGE_KEY, MOCK_QUEUE_REQUESTS);

    // If completed, append to Dispense History
    if (newStatus === 'completed') {
      const historyItem: DispenseLog = {
        id: `dsp-${Date.now()}`,
        request_id: updated.id,
        token_number: updated.token_number,
        mr_number: updated.patient.mr_number,
        patient_name: updated.patient.full_name,
        doctor_name: updated.doctor.full_name,
        items_count: updated.medicines.length,
        total_amount: updated.total_amount,
        payment_status: updated.payment_status,
        dispensed_at: now,
        dispensed_by: updated.dispensed_by || 'Pharmacist Ramesh P.',
        medicines_summary: updated.medicines.map((m) => `${m.medicine_name} x ${m.prescribed_qty}`),
        status: 'completed',
      };
      MOCK_DISPENSE_HISTORY.unshift(historyItem);
      setStoredData(HISTORY_STORAGE_KEY, MOCK_DISPENSE_HISTORY);
    }

    // Try sending update to FastAPI backend asynchronously
    try {
      if (newStatus === 'preparing') {
        await api.post(`/pharmacy-queue/${requestId}/start`);
      } else if (newStatus === 'completed') {
        await api.post(`/pharmacy-queue/${requestId}/complete`);
      }
    } catch (e) {
      // Graceful offline fallback
    }

    return updated;
  },

  // 3. Stock Inventory Management (PH-05)
  async getStockInventory(): Promise<DrugStockItem[]> {
    MOCK_STOCK_ITEMS = getStoredData(STOCK_STORAGE_KEY, INITIAL_STOCK_ITEMS);
    return MOCK_STOCK_ITEMS;
  },

  async updateStockItem(stockId: string, deltaQty: number, reason: string): Promise<DrugStockItem> {
    const item = MOCK_STOCK_ITEMS.find((s) => s.id === stockId);
    if (!item) throw new Error('Stock item not found');

    item.total_stock = Math.max(0, item.total_stock + deltaQty);
    if (item.total_stock === 0) {
      item.status = 'out_of_stock';
    } else if (item.total_stock <= item.reorder_level) {
      item.status = 'low_stock';
    } else {
      item.status = 'in_stock';
    }
    item.updated_at = new Date().toISOString();
    setStoredData(STOCK_STORAGE_KEY, MOCK_STOCK_ITEMS);
    return item;
  },

  async addStockItem(newItemData: Omit<DrugStockItem, 'id' | 'updated_at'>): Promise<DrugStockItem> {
    const newItem: DrugStockItem = {
      ...newItemData,
      id: `stk-${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    MOCK_STOCK_ITEMS.unshift(newItem);
    setStoredData(STOCK_STORAGE_KEY, MOCK_STOCK_ITEMS);
    return newItem;
  },

  // 4. Dispensing History (PH-06)
  async getDispenseHistory(): Promise<DispenseLog[]> {
    MOCK_DISPENSE_HISTORY = getStoredData(HISTORY_STORAGE_KEY, INITIAL_DISPENSE_HISTORY);
    return MOCK_DISPENSE_HISTORY;
  },

  // 5. Dashboard Summary Metrics
  async getMetrics(): Promise<QueueMetrics> {
    MOCK_QUEUE_REQUESTS = getStoredData(QUEUE_STORAGE_KEY, INITIAL_QUEUE_REQUESTS);
    MOCK_STOCK_ITEMS = getStoredData(STOCK_STORAGE_KEY, INITIAL_STOCK_ITEMS);
    MOCK_DISPENSE_HISTORY = getStoredData(HISTORY_STORAGE_KEY, INITIAL_DISPENSE_HISTORY);

    const pending = MOCK_QUEUE_REQUESTS.filter((r) => r.status === 'pending' || r.status === 'reviewing').length;
    const preparing = MOCK_QUEUE_REQUESTS.filter((r) => r.status === 'preparing').length;
    const ready = MOCK_QUEUE_REQUESTS.filter((r) => r.status === 'ready').length;
    const statAlerts = MOCK_QUEUE_REQUESTS.filter((r) => r.priority === 'stat' && r.status !== 'completed').length;
    const lowStockAlerts = MOCK_STOCK_ITEMS.filter((s) => s.status === 'low_stock' || s.status === 'out_of_stock').length;

    return {
      pending_count: pending,
      preparing_count: preparing,
      ready_count: ready,
      dispensed_today: MOCK_DISPENSE_HISTORY.length + 18, // Total count for day
      avg_wait_minutes: 8.4,
      stat_alerts_count: statAlerts,
      low_stock_alerts_count: lowStockAlerts,
    };
  },

  // Pharmacist profile details
  getPharmacistProfile(): PharmacistProfile {
    return {
      id: 'ph-9912',
      full_name: 'Ramesh Patel, B.Pharm',
      role: 'Senior Pharmacist',
      license_number: 'TS-PH-2022-8841',
      shift: 'Morning',
      counter_number: 'Counter #02 (OPD Main)',
    };
  },

  // Reset Demo Data
  resetDemoData(): void {
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      localStorage.removeItem(STOCK_STORAGE_KEY);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
    MOCK_QUEUE_REQUESTS = [...INITIAL_QUEUE_REQUESTS];
    MOCK_STOCK_ITEMS = [...INITIAL_STOCK_ITEMS];
    MOCK_DISPENSE_HISTORY = [...INITIAL_DISPENSE_HISTORY];
  },
};

