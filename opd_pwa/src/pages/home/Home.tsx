import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { queueService } from '../../services/queueService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { getAppointmentStatusStyle } from '../../utils/status';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import {
  Calendar,
  Clock,
  MapPin,
  Pill,
  FileText,
  User,
  ArrowRight,
  Bell,
  Stethoscope,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { patient } = useAuth();
  const nav = useAppNavigation();

  const { data: appointmentsRes } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
  });

  const { data: latestRxRes } = useQuery({
    queryKey: ['latestPrescription'],
    queryFn: () => prescriptionService.getLatestPrescription(),
  });

  const nextAppointment = appointmentsRes?.data?.find(
    (a) => a.status === 'confirmed' || a.status === 'check_in_available' || a.status === 'checked_in' || a.status === 'waiting'
  );

  const { data: queueRes } = useQuery({
    queryKey: ['activeQueue', nextAppointment?.id],
    queryFn: () => queueService.getQueueState(nextAppointment?.id || 'apt-501'),
    enabled: !!nextAppointment && (nextAppointment.status === 'checked_in' || nextAppointment.status === 'waiting'),
  });

  const activeQueue = queueRes?.data;
  const latestRx = latestRxRes?.data;

  return (
    <ScreenContainer hasBottomNav={true}>
      {/* Header Profile Greeting */}
      <div className="flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={patient?.fullName || 'Rajesh Sharma'} size="medium" />
          <div>
            <h1 className="text-base font-bold text-[#16343C] leading-tight">
              Hello, {patient?.fullName ? patient.fullName.split(' ')[0] : 'Patient'}
            </h1>
            <p className="text-xs text-[#708188] font-medium flex items-center gap-1">
              <span>MR:</span>
              <span className="text-[#0B6875] font-extrabold">{patient?.mrNumber || 'MR-2026-8842'}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={nav.goToNotifications}
          className="relative p-2.5 rounded-full bg-white border border-[#DCE6E7] text-[#0B6875] shadow-2xs hover:bg-[#DFF3F5] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C94B4B] rounded-full ring-2 ring-white" />
        </button>
      </div>

      {/* Live Queue Active Banner */}
      {activeQueue && (
        <AppCard variant="highlight" className="mb-4 animate-pulse-glow border-[#0B6875]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B6875] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Live OPD Queue Status
            </span>
            <StatusBadge label={activeQueue.status === 'waiting' ? 'In Queue' : 'Checked In'} variant="warning" />
          </div>

          <div className="flex items-center justify-between my-2">
            <div>
              <p className="text-xs text-[#708188]">Your Token Number</p>
              <p className="text-3xl font-black text-[#0B6875] tracking-tight">{activeQueue.myToken}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#708188]">Now Serving</p>
              <p className="text-xl font-bold text-[#16343C]">{activeQueue.currentServingToken}</p>
            </div>
            <div className="text-right border-l border-[#0B6875]/20 pl-3">
              <p className="text-xs text-[#708188]">Ahead</p>
              <p className="text-xl font-bold text-[#0B6875]">{activeQueue.patientsAhead} Patients</p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#0B6875]/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#16343C]">
              Est. Wait: ~{activeQueue.estimatedWaitMinutes} mins
            </span>
            <AppButton size="small" onClick={() => nav.goToQueueTrack(nextAppointment?.id || 'apt-501')}>
              Track Live Queue
            </AppButton>
          </div>
        </AppCard>
      )}

      {/* Next Appointment Card */}
      {nextAppointment ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[#16343C]">Next Appointment</h2>
            <Link to="/appointments" className="text-xs font-bold text-[#0B6875] hover:underline flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <AppCard className="border-[#0B6875]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-[#DFF3F5] text-[#0B6875] flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#16343C]">{nextAppointment.doctorName}</h3>
                  <p className="text-xs text-[#708188]">{nextAppointment.doctorSpeciality}</p>
                </div>
              </div>
              <StatusBadge {...getAppointmentStatusStyle(nextAppointment.status)} />
            </div>

            <div className="bg-[#F7F9F8] rounded-[12px] p-2.5 my-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#16343C]">
                <Calendar className="w-4 h-4 text-[#0B6875]" />
                <span className="font-semibold">{formatDate(nextAppointment.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#16343C]">
                <Clock className="w-4 h-4 text-[#0B6875]" />
                <span className="font-semibold">{nextAppointment.timeSlot}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#708188] col-span-2">
                <MapPin className="w-4 h-4 text-[#0B6875]" />
                <span>{nextAppointment.doctorRoom} • Balaji Heart Center Main OPD</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {nextAppointment.status === 'check_in_available' && (
                <AppButton
                  size="small"
                  variant="primary"
                  className="flex-1"
                  onClick={() => nav.goToCheckIn(nextAppointment.id)}
                >
                  Clinic Check-In Now
                </AppButton>
              )}
              <AppButton
                size="small"
                variant="outline"
                className="flex-1"
                onClick={() => nav.goToAppointmentDetails(nextAppointment.id)}
              >
                Appointment Details
              </AppButton>
            </div>
          </AppCard>
        </div>
      ) : (
        <AppCard className="mb-4 bg-gradient-to-r from-[#DFF3F5]/40 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#16343C]">No Upcoming Appointments</h3>
              <p className="text-xs text-[#708188] mt-0.5">Book a consultation with our Cardiology specialists.</p>
            </div>
            <AppButton size="small" onClick={() => nav.goToDoctorDetails('doc-1')}>
              Book Now
            </AppButton>
          </div>
        </AppCard>
      )}

      {/* Quick Action Grid */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-[#16343C] mb-2.5">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => nav.goToDoctorDetails('doc-1')}
            className="flex items-center gap-3 p-3.5 bg-white rounded-[16px] border border-[#DCE6E7] hover:border-[#0B6875] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#DFF3F5] text-[#0B6875] flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#16343C]">Book Doctor</p>
              <p className="text-[10px] text-[#708188]">Find OPD slots</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => nav.goToPrescription('rx-701')}
            className="flex items-center gap-3 p-3.5 bg-white rounded-[16px] border border-[#DCE6E7] hover:border-[#0B6875] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#23866A]/10 text-[#23866A] flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#16343C]">Prescriptions</p>
              <p className="text-[10px] text-[#708188]">View & Share</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => nav.goToDocument('doc-vis-301')}
            className="flex items-center gap-3 p-3.5 bg-white rounded-[16px] border border-[#DCE6E7] hover:border-[#0B6875] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#E9A83A]/10 text-[#a06a10] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#16343C]">Medical Records</p>
              <p className="text-[10px] text-[#708188]">Labs & Summaries</p>
            </div>
          </button>

          <button
            type="button"
            onClick={nav.goToProfile}
            className="flex items-center gap-3 p-3.5 bg-white rounded-[16px] border border-[#DCE6E7] hover:border-[#0B6875] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#708188]/10 text-[#708188] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#16343C]">My Profile</p>
              <p className="text-[10px] text-[#708188]">Patient Details</p>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Active Prescription Banner */}
      {latestRx && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[#16343C]">Active Prescription</h2>
            <button
              type="button"
              onClick={() => nav.goToPrescription(latestRx.id)}
              className="text-xs font-bold text-[#0B6875] hover:underline flex items-center"
            >
              Details <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <AppCard className="border-l-4 border-l-[#23866A]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-bold text-[#16343C]">{latestRx.doctorName}</p>
                <p className="text-[11px] text-[#708188]">Date: {formatDate(latestRx.consultationDate)}</p>
              </div>
              <StatusBadge label="Active Rx" variant="success" />
            </div>

            <div className="space-y-1.5 my-2">
              {latestRx.medicines.map((m) => (
                <div key={m.id} className="flex justify-between items-center text-xs py-1 border-b border-[#F7F9F8]">
                  <span className="font-semibold text-[#16343C]">{m.medicineName} ({m.strength})</span>
                  <span className="text-[#708188] text-[11px] font-medium">{m.specialInstructions}</span>
                </div>
              ))}
            </div>

            <AppButton
              size="small"
              variant="secondary"
              className="w-full mt-2"
              onClick={() => nav.goToPrescription(latestRx.id)}
            >
              Send Prescription to Pharmacy
            </AppButton>
          </AppCard>
        </div>
      )}
    </ScreenContainer>
  );
};
