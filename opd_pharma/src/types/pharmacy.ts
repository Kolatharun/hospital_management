export type QueueStatus = 'pending' | 'reviewing' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PriorityLevel = 'stat' | 'urgent' | 'routine';
export type PaymentStatus = 'paid' | 'pending_billing' | 'insurance_approved' | 'exempt';
export type StockStatus = 'in_stock' | 'low_stock' | 'expiring_soon' | 'out_of_stock';

export interface MedicineItem {
  id: string;
  medicine_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions: string;
  prescribed_qty: number;
  original_qty?: number;
  available_qty: number;
  unit_price: number;
  stock_status: StockStatus;
  batch_number?: string;
  expiry_date?: string;
  rack_location?: string;
  adjustment_reason?: string;
  substitute_options?: {
    id: string;
    brand_name: string;
    generic_name: string;
    available_qty: number;
    unit_price: number;
  }[];
}

export interface AllergyInfo {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
}

export interface PatientInfo {
  id: string;
  mr_number: string;
  op_number: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  blood_group?: string;
  allergies?: AllergyInfo[];
  weight_kg?: number;
  vitals?: {
    bp?: string;
    pulse?: number;
    sp02?: number;
  };
}

export interface DoctorInfo {
  id: string;
  full_name: string;
  department: string;
  qualification: string;
  registration_number: string;
}

export interface PrescriptionRequest {
  id: string;
  appointment_id: string;
  token_number: number;
  patient: PatientInfo;
  doctor: DoctorInfo;
  status: QueueStatus;
  priority: PriorityLevel;
  payment_status: PaymentStatus;
  diagnosis: string;
  clinical_notes?: string;
  medicines: MedicineItem[];
  created_at: string;
  reviewed_at?: string;
  prepared_at?: string;
  ready_at?: string;
  dispensed_at?: string;
  total_amount: number;
  dispensed_by?: string;
  counseling_notes?: string;
  rejection_reason?: string;
}

export interface DrugStockItem {
  id: string;
  brand_name: string;
  generic_name: string;
  category: 'Tablets' | 'Syrups' | 'Injections' | 'Ointments' | 'Inhalers' | 'Cardiology Special';
  dosage_form: string;
  strength: string;
  manufacturer: string;
  rack_location: string;
  total_stock: number;
  reorder_level: number;
  unit_price: number;
  status: StockStatus;
  batches: {
    batch_number: string;
    expiry_date: string;
    quantity: number;
    mfg_date: string;
  }[];
  updated_at: string;
}

export interface DispenseLog {
  id: string;
  request_id: string;
  token_number: number;
  mr_number: string;
  patient_name: string;
  doctor_name: string;
  items_count: number;
  total_amount: number;
  payment_status: PaymentStatus;
  dispensed_at: string;
  dispensed_by: string;
  medicines_summary: string[];
  status: QueueStatus;
}

export interface PharmacistProfile {
  id: string;
  full_name: string;
  role: 'Senior Pharmacist' | 'Dispensing Pharmacist' | 'Stock Manager';
  license_number: string;
  shift: 'Morning' | 'Evening' | 'Night';
  counter_number: string;
}

export interface QueueMetrics {
  pending_count: number;
  preparing_count: number;
  ready_count: number;
  dispensed_today: number;
  avg_wait_minutes: number;
  stat_alerts_count: number;
  low_stock_alerts_count: number;
}
