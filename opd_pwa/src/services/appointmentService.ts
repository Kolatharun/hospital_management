import { simulateLatency } from './apiClient';
import { mockAppointments } from '../mocks/appointments';
import { Appointment } from '../types';

let localAppointments = [...mockAppointments];

export const appointmentService = {
  getAppointments: async () => {
    return simulateLatency(localAppointments, 400);
  },

  getAppointmentById: async (id: string) => {
    const apt = localAppointments.find((a) => a.id === id);
    if (!apt) {
      return { success: false, data: null, message: 'Appointment not found' };
    }
    return simulateLatency(apt, 300);
  },

  createAppointment: async (bookingData: { doctorId: string; doctorName: string; doctorSpeciality: string; doctorRoom: string; date: string; timeSlot: string; type: 'new' | 'review' }) => {
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      opNumber: `OP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: 'pat-101',
      mrNumber: 'MR-2026-8842',
      doctorId: bookingData.doctorId,
      doctorName: bookingData.doctorName,
      doctorSpeciality: bookingData.doctorSpeciality,
      doctorRoom: bookingData.doctorRoom,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      type: bookingData.type,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    localAppointments.unshift(newApt);
    return simulateLatency(newApt, 600);
  },

  rescheduleAppointment: async (id: string, newDate: string, newSlot: string, reason?: string) => {
    const idx = localAppointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localAppointments[idx] = {
        ...localAppointments[idx],
        date: newDate,
        timeSlot: newSlot,
        status: 'rescheduled',
        rescheduleReason: reason,
      };
      return simulateLatency(localAppointments[idx], 500);
    }
    return { success: false, data: null, message: 'Appointment not found' };
  },

  cancelAppointment: async (id: string, reason?: string) => {
    const idx = localAppointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localAppointments[idx] = {
        ...localAppointments[idx],
        status: 'cancelled',
        cancelReason: reason,
      };
      return simulateLatency(localAppointments[idx], 500);
    }
    return { success: false, data: null, message: 'Appointment not found' };
  },

  checkIn: async (id: string) => {
    const idx = localAppointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const generatedToken = `B-${Math.floor(10 + Math.random() * 20)}`;
      localAppointments[idx] = {
        ...localAppointments[idx],
        status: 'checked_in',
        tokenNumber: generatedToken,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return simulateLatency(localAppointments[idx], 600);
    }
    return { success: false, data: null, message: 'Appointment not found' };
  },
};
