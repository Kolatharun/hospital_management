import { simulateLatency } from './apiClient';
import { mockPharmacyRequests } from '../mocks/pharmacy';
import { PharmacyRequest } from '../types';

let localPharmacyRequests = [...mockPharmacyRequests];

export const pharmacyService = {
  getPharmacyRequestById: async (id: string) => {
    const req = localPharmacyRequests.find((r) => r.id === id);
    if (!req) {
      return { success: false, data: null, message: 'Pharmacy request not found' };
    }
    return simulateLatency(req, 300);
  },

  sendPrescriptionToPharmacy: async (data: {
    prescriptionId: string;
    fulfillmentType: 'pickup' | 'home_delivery';
    deliveryAddress?: string;
  }) => {
    const newReq: PharmacyRequest = {
      id: `ph-req-${Date.now()}`,
      prescriptionId: data.prescriptionId,
      patientId: 'pat-101',
      pharmacyName: 'Balaji Heart Center In-House Pharmacy',
      pharmacyPhone: '+91 22 2500 1122',
      fulfillmentType: data.fulfillmentType,
      deliveryAddress: data.deliveryAddress,
      status: 'sent',
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pharmacistNotes: 'Request submitted to pharmacist queue for review.',
    };

    localPharmacyRequests.unshift(newReq);
    return simulateLatency(newReq, 600);
  },
};
