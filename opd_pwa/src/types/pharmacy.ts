export type PharmacyRequestState =
  | 'draft'
  | 'consent_required'
  | 'sending'
  | 'sent'
  | 'received'
  | 'reviewing'
  | 'ready'
  | 'partially_available'
  | 'unavailable'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PharmacyRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyName: string;
  pharmacyPhone: string;
  fulfillmentType: 'pickup' | 'home_delivery';
  deliveryAddress?: string;
  status: PharmacyRequestState;
  requestedAt: string;
  updatedAt: string;
  pharmacistNotes?: string;
}
