import { create } from 'zustand';

interface BookingStoreState {
  selectedDoctorId: string | null;
  selectedDate: string | null;
  selectedSlotId: string | null;
  consultationType: 'new' | 'review';
  setDoctor: (doctorId: string) => void;
  setDate: (date: string) => void;
  setSlot: (slotId: string) => void;
  setConsultationType: (type: 'new' | 'review') => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  selectedDoctorId: null,
  selectedDate: null,
  selectedSlotId: null,
  consultationType: 'new',

  setDoctor: (selectedDoctorId) => set({ selectedDoctorId }),
  setDate: (selectedDate) => set({ selectedDate, selectedSlotId: null }),
  setSlot: (selectedSlotId) => set({ selectedSlotId }),
  setConsultationType: (consultationType) => set({ consultationType }),
  resetBooking: () =>
    set({
      selectedDoctorId: null,
      selectedDate: null,
      selectedSlotId: null,
      consultationType: 'new',
    }),
}));
