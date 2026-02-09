/**
 * Billing Service - API calls for billing management
 */

import api from './api';

export interface BillLineItem {
  id?: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  appointment_id?: string;
  patient_id: string;
  created_by?: string;
  uhid?: string;
  patient_name: string;
  patient_age?: string;
  patient_gender?: string;
  doctor_name?: string;
  speciality?: string;
  mobile_no?: string;
  patient_type?: string;
  token_number?: string;
  consultation_fee: number;
  other_charges?: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  discount_given_by?: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  lab_total: number;
  lab_and_investigations?: string;
  line_items: BillLineItem[];
  created_at: string;
  updated_at: string;
}

export interface BillCreate {
  patient_id: string;
  appointment_id?: string;
  consultation_fee: number;
  other_charges?: string;
  discount_amount?: number;
  discount_percent?: number;
  discount_given_by?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  line_items: Omit<BillLineItem, 'id'>[];
  paid_amount: number;
  payment_method?: string;
  payment_reference?: string;
}

export interface BillUpdate {
  consultation_fee?: number;
  other_charges?: string;
  discount_amount?: number;
  discount_percent?: number;
  discount_given_by?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  line_items?: Omit<BillLineItem, 'id'>[];
  paid_amount?: number;
  payment_method?: string;
  payment_reference?: string;
}

export interface BillSearchParams {
  query?: string;
  patient_id?: string;
  mr_number?: string;
  bill_number?: string;
  from_date?: string;
  to_date?: string;
  payment_status?: string;
  skip?: number;
  limit?: number;
}

export interface PaymentRequest {
  amount: number;
  payment_method: string;
  payment_reference?: string;
}

export interface DayPaymentSummary {
  date: string;
  total_bills: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  cash_amount: number;
  card_amount: number;
  upi_amount: number;
  paid_count: number;
  partial_count: number;
  pending_count: number;
}

export const billingService = {
  async create(data: BillCreate): Promise<Bill> {
    return api.post<Bill>('/billing', data);
  },

  async getById(billId: string): Promise<Bill> {
    return api.get<Bill>(`/billing/${billId}`);
  },

  async getByAppointment(appointmentId: string): Promise<Bill> {
    return api.get<Bill>(`/billing/appointment/${appointmentId}`);
  },

  async getPatientBills(patientId: string, skip = 0, limit = 20): Promise<Bill[]> {
    return api.get<Bill[]>(`/billing/patient/${patientId}?skip=${skip}&limit=${limit}`);
  },

  async getTodayBills(): Promise<Bill[]> {
    return api.get<Bill[]>('/billing/today');
  },

  async getPendingBills(): Promise<Bill[]> {
    return api.get<Bill[]>('/billing/pending');
  },

  async getDaySummary(date?: string): Promise<DayPaymentSummary> {
    const url = date ? `/billing/summary?target_date=${date}` : '/billing/summary';
    return api.get<DayPaymentSummary>(url);
  },

  async recordPayment(billId: string, data: PaymentRequest): Promise<Bill> {
    return api.post<Bill>(`/billing/${billId}/payment`, data);
  },

  async update(billId: string, data: BillUpdate): Promise<Bill> {
    return api.put<Bill>(`/billing/${billId}`, data);
  },

  async search(params: BillSearchParams): Promise<Bill[]> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.patient_id) queryParams.append('patient_id', params.patient_id);
    if (params.mr_number) queryParams.append('mr_number', params.mr_number);
    if (params.bill_number) queryParams.append('bill_number', params.bill_number);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    return api.get<Bill[]>(`/billing/search${queryString ? `?${queryString}` : ''}`);
  },
};

export default billingService;
