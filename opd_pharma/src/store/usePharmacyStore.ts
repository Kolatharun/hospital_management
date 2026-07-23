import { create } from 'zustand';
import { PrescriptionRequest, DrugStockItem, PharmacistProfile } from '../types/pharmacy';

interface PharmacyState {
  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Global search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Audio alert toggle
  audioAlertsEnabled: boolean;
  toggleAudioAlerts: () => void;

  // Online / Realtime Connection state
  connectionStatus: 'online' | 'synced_local' | 'offline';
  setConnectionStatus: (status: 'online' | 'synced_local' | 'offline') => void;

  // Active Modals & Drawers
  selectedRequestForDrawer: PrescriptionRequest | null;
  openPrescriptionDrawer: (request: PrescriptionRequest) => void;
  closePrescriptionDrawer: () => void;

  selectedRequestForHandover: PrescriptionRequest | null;
  openHandoverModal: (request: PrescriptionRequest) => void;
  closeHandoverModal: () => void;

  selectedRequestForPrint: PrescriptionRequest | null;
  openPrintModal: (request: PrescriptionRequest) => void;
  closePrintModal: () => void;

  selectedStockForEdit: DrugStockItem | null;
  openStockModal: (item?: DrugStockItem) => void;
  closeStockModal: () => void;
  isStockModalOpen: boolean;

  // Notification count
  notificationCount: number;
  clearNotifications: () => void;

  // Pharmacist profile
  pharmacist: PharmacistProfile;
}

export const usePharmacyStore = create<PharmacyState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  audioAlertsEnabled: true,
  toggleAudioAlerts: () => set((state) => ({ audioAlertsEnabled: !state.audioAlertsEnabled })),

  connectionStatus: 'online',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  selectedRequestForDrawer: null,
  openPrescriptionDrawer: (request) => set({ selectedRequestForDrawer: request }),
  closePrescriptionDrawer: () => set({ selectedRequestForDrawer: null }),

  selectedRequestForHandover: null,
  openHandoverModal: (request) => set({ selectedRequestForHandover: request }),
  closeHandoverModal: () => set({ selectedRequestForHandover: null }),

  selectedRequestForPrint: null,
  openPrintModal: (request) => set({ selectedRequestForPrint: request }),
  closePrintModal: () => set({ selectedRequestForPrint: null }),

  selectedStockForEdit: null,
  isStockModalOpen: false,
  openStockModal: (item) => set({ selectedStockForEdit: item || null, isStockModalOpen: true }),
  closeStockModal: () => set({ selectedStockForEdit: null, isStockModalOpen: false }),

  notificationCount: 3,
  clearNotifications: () => set({ notificationCount: 0 }),

  pharmacist: {
    id: 'ph-9912',
    full_name: 'Ramesh Patel, B.Pharm',
    role: 'Senior Pharmacist',
    license_number: 'TS-PH-2022-8841',
    shift: 'Morning',
    counter_number: 'Counter #02 (OPD Main)',
  },
}));
