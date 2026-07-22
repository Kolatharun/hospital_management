import { PharmacyRequest } from '../types';

export const mockPharmacyRequests: PharmacyRequest[] = [
  {
    id: 'ph-req-901',
    prescriptionId: 'rx-701',
    patientId: 'pat-101',
    pharmacyName: 'Balaji Heart Center In-House Pharmacy',
    pharmacyPhone: '+91 22 2500 1122',
    fulfillmentType: 'pickup',
    status: 'ready',
    requestedAt: '2026-06-15T12:30:00Z',
    updatedAt: '2026-06-15T13:15:00Z',
    pharmacistNotes: 'All 3 prescribed medicines (Telmisartan, Atorvastatin, Ecosprin) are packed and ready for pickup at Counter 2.',
  },
];
