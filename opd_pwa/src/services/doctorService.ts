import { simulateLatency } from './apiClient';
import { mockDoctors, mockTimeSlots } from '../mocks/doctors';

export const doctorService = {
  getDoctors: async (search?: string, department?: string) => {
    let filtered = [...mockDoctors];
    if (department && department !== 'All') {
      filtered = filtered.filter((d) => d.department.toLowerCase() === department.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.name.toLowerCase().includes(q) || d.speciality.toLowerCase().includes(q) || d.qualification.toLowerCase().includes(q)
      );
    }
    return simulateLatency(filtered, 400);
  },

  getDoctorById: async (id: string) => {
    const doctor = mockDoctors.find((d) => d.id === id);
    if (!doctor) {
      return { success: false, data: null, message: 'Doctor not found' };
    }
    return simulateLatency(doctor, 300);
  },

  getTimeSlots: async (doctorId: string, _date: string) => {
    const slots = mockTimeSlots.filter((s) => s.doctorId === doctorId);
    return simulateLatency(slots, 400);
  },
};
