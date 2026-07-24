import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { queueService } from '../../services/queueService';
import { careCircleService } from '../../services/careCircleService';
import { useCareCircleStore } from '../../store/careCircleStore';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { HomeEmergencyCard } from '../../components/home/HomeEmergencyCard';
import { EmergencyHelpSheet } from '../../components/sheets/EmergencyHelpSheet';
import { CareCircleWidget } from '../../components/home/CareCircleWidget';
import { AddCareMemberModal } from '../../components/careCircle/AddCareMemberModal';
import { CareMember } from '../../types';

export const Home: React.FC = () => {
  const { patient } = useAuth();
  const { language, setLanguage } = useUIStore();
  const nav = useAppNavigation();
  const { activeMemberId, setActiveMemberId, members, setMembers, addMember } = useCareCircleStore();

  const [isEmergencySheetOpen, setIsEmergencySheetOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const { data: careMembers } = useQuery({
    queryKey: ['careMembers'],
    queryFn: async () => {
      const data = await careCircleService.getCareMembers();
      setMembers(data);
      return data;
    },
  });

  const memberList = careMembers || members;

  const patientFirstName = patient?.fullName ? patient.fullName.split(' ')[0] : 'Priyanshu';


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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#f7fafa] text-[#181c1d] pb-24 font-sans antialiased">
      {/* TopAppBar - Matching Stitch exactly */}
      <header className="w-full top-0 sticky bg-[#f7fafa] z-40 border-b border-[#bec8cb]/20">
        <div className="flex items-center justify-between px-5 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0b6875] text-white flex items-center justify-center font-bold text-base shadow-sm border border-[#bec8cb]">
              {patientFirstName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-[#004e59]">
                Good morning, {patientFirstName}
              </h1>
              <p className="text-sm text-[#3f484a]">How can we help you today?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 border border-[#bec8cb] rounded-md text-xs font-medium text-[#3f484a] hover:bg-[#f1f4f5] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
              <span className="text-[#6f797b]">/</span>
              <span>{language === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={nav.goToNotifications}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f1f4f5] transition-colors cursor-pointer active:opacity-80 text-[#004e59] relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                notifications
              </span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <ScreenContainer hasBottomNav={true} className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-6">
        {/* Safe Home Emergency Control - Highly Visible & Safe 2-step flow */}
        <HomeEmergencyCard
          onOpenEmergencySheet={() => setIsEmergencySheetOpen(true)}
          isSheetOpen={isEmergencySheetOpen}
        />

        {/* Active Queue Card (Elevated Priority) - Stitch Exact Design */}
        <section className="bg-[#0b6875] text-[#9ae4f3] rounded-[22px] p-5 shadow-[0px_8px_24px_rgba(22,52,60,0.08)] relative overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />

          <div className="flex justify-between items-start mb-3 relative z-10">
            <h2 className="text-lg font-semibold text-white">Your queue status</h2>
            <div className="px-2 py-1 bg-white/20 rounded-md text-[11px] font-semibold text-white tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#a4eefd] animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="bg-[#f7fafa] rounded-xl p-3 shadow-inner flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-xs text-[#3f484a]">Token</span>
              <span className="text-2xl font-bold text-[#004e59]">{activeQueue ? activeQueue.myToken : 'A-12'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white/80">Currently serving:</span>
              <span className="text-xl font-semibold text-white">{activeQueue ? activeQueue.currentServingToken : 'A-09'}</span>
            </div>
          </div>

          <div className="mb-4 relative z-10">
            <div className="flex justify-between text-sm text-white/90 mb-2">
              <span>{activeQueue ? `${activeQueue.patientsAhead} patients ahead` : '3 patients ahead'}</span>
              <span>~{activeQueue ? activeQueue.estimatedWaitMinutes : '25'} mins</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#a4eefd] w-1/4 rounded-full" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav.goToQueueTrack(nextAppointment?.id || 'apt-501')}
            className="w-full py-3 bg-white text-[#004e59] rounded-xl font-semibold hover:bg-[#f7fafa] transition-colors active:scale-95 duration-200 shadow-sm relative z-10 cursor-pointer"
          >
            Track live queue
          </button>
        </section>

        {/* Next Appointment Card - Stitch Exact Design */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/30 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[#bec8cb]/30 pb-2 mb-1">
            <h2 className="text-[11px] font-semibold text-[#3f484a] uppercase tracking-wider">Next appointment</h2>
            <span className="px-2 py-1 bg-[#d2e6e8] text-[#004e59] text-[11px] font-semibold rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Confirmed
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#f1f4f5] rounded-full flex items-center justify-center text-[#004e59] shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                stethoscope
              </span>
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-[#181c1d]">{nextAppointment ? nextAppointment.doctorName : 'Dr. Ananya Rao'}</h3>
              <p className="text-sm text-[#3f484a]">{nextAppointment ? nextAppointment.doctorSpeciality : 'Cardiologist'}</p>
            </div>
          </div>

          <div className="bg-[#f1f4f5] rounded-lg p-3 flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6f797b] text-[18px]">calendar_today</span>
              <span className="text-sm text-[#181c1d]">{nextAppointment ? formatDate(nextAppointment.date) : 'July 24, 2026'}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-[#bec8cb]/50 pl-4">
              <span className="material-symbols-outlined text-[#6f797b] text-[18px]">schedule</span>
              <span className="text-sm text-[#181c1d]">{nextAppointment ? nextAppointment.timeSlot : '10:30 AM'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#3f484a] my-1">
            <span className="material-symbols-outlined text-[#6f797b] text-[18px]">meeting_room</span>
            {nextAppointment ? nextAppointment.doctorRoom : 'Consultation Room 03, Ground Floor'}
          </div>

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => nav.goToAppointmentDetails(nextAppointment?.id || 'apt-501')}
              className="flex-1 bg-[#004e59] text-white py-3 rounded-xl font-semibold min-h-[48px] hover:bg-[#0b6875] transition-colors active:scale-95 duration-200 cursor-pointer text-center"
            >
              View appointment
            </button>
            <a
              href="tel:+912225001122"
              className="flex-1 bg-[#d2e6e8] text-[#004e59] py-3 rounded-xl font-semibold min-h-[48px] hover:bg-[#d8dadb] transition-colors active:scale-95 duration-200 flex items-center justify-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call clinic
            </a>
          </div>
        </section>

        {/* Quick Actions Grid - Stitch Exact 2x2 Layout */}
        <section className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => nav.goToDoctorDetails('doc-1')}
            className="bg-white p-4 rounded-[16px] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/20 flex flex-col items-center justify-center gap-2 hover:bg-[#f1f4f5] transition-colors active:scale-95 duration-200 min-h-[100px] cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#004e59]/10 rounded-full flex items-center justify-center text-[#004e59]">
              <span className="material-symbols-outlined">add_box</span>
            </div>
            <span className="text-xs font-medium text-[#181c1d] text-center leading-tight">
              Book<br />appointment
            </span>
          </button>

          <button
            type="button"
            onClick={() => nav.navigate('/appointments')}
            className="bg-white p-4 rounded-[16px] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/20 flex flex-col items-center justify-center gap-2 hover:bg-[#f1f4f5] transition-colors active:scale-95 duration-200 min-h-[100px] cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#004e59]/10 rounded-full flex items-center justify-center text-[#004e59]">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <span className="text-xs font-medium text-[#181c1d] text-center leading-tight">
              My<br />appointments
            </span>
          </button>

          <button
            type="button"
            onClick={() => nav.navigate('/records')}
            className="bg-white p-4 rounded-[16px] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/20 flex flex-col items-center justify-center gap-2 hover:bg-[#f1f4f5] transition-colors active:scale-95 duration-200 min-h-[100px] cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#004e59]/10 rounded-full flex items-center justify-center text-[#004e59]">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <span className="text-xs font-medium text-[#181c1d] text-center leading-tight">
              Medical<br />records
            </span>
          </button>

          <button
            type="button"
            onClick={() => nav.goToPrescription(latestRx?.id || 'rx-701')}
            className="bg-white p-4 rounded-[16px] shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/20 flex flex-col items-center justify-center gap-2 hover:bg-[#f1f4f5] transition-colors active:scale-95 duration-200 min-h-[100px] cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#004e59]/10 rounded-full flex items-center justify-center text-[#004e59]">
              <span className="material-symbols-outlined">medication</span>
            </div>
            <span className="text-xs font-medium text-[#181c1d] text-center leading-tight">
              Prescriptions
            </span>
          </button>
        </section>

        {/* Latest Prescription Card - Stitch Exact Design */}
        <section className="bg-white rounded-[20px] p-5 shadow-[0px_4px_12px_rgba(22,52,60,0.04)] border border-[#bec8cb]/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#181c1d]">Latest prescription</h2>
            <span className="text-sm text-[#3f484a]">{latestRx ? formatDate(latestRx.consultationDate) : 'July 10, 2026'}</span>
          </div>

          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#bec8cb]/30">
            <div className="w-8 h-8 bg-[#f1f4f5] rounded-full flex items-center justify-center text-[#3f484a]">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                stethoscope
              </span>
            </div>
            <span className="text-sm text-[#181c1d]">{latestRx ? latestRx.doctorName : 'Dr. Ananya Rao'}</span>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {latestRx ? (
              latestRx.medicines.map((med) => (
                <div key={med.id} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#6f797b] text-[20px] mt-1">pill</span>
                  <div>
                    <p className="text-xs font-semibold text-[#181c1d]">{med.medicineName} {med.strength}</p>
                    <p className="text-xs text-[#3f484a]">{med.specialInstructions || '1 tablet daily'}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#6f797b] text-[20px] mt-1">pill</span>
                  <div>
                    <p className="text-xs font-semibold text-[#181c1d]">Atorvastatin 20mg</p>
                    <p className="text-xs text-[#3f484a]">1 tablet daily after dinner</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#6f797b] text-[20px] mt-1">water_drop</span>
                  <div>
                    <p className="text-xs font-semibold text-[#181c1d]">Metoprolol 50mg</p>
                    <p className="text-xs text-[#3f484a]">1 tablet morning, 1 evening</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => nav.goToPrescription(latestRx?.id || 'rx-701')}
              className="flex-1 border border-[#bec8cb] text-[#004e59] py-2 rounded-lg text-xs font-semibold hover:bg-[#f1f4f5] transition-colors min-h-[44px] cursor-pointer"
            >
              View full
            </button>
            <button
              type="button"
              onClick={() => nav.navigate(`/prescriptions/${latestRx?.id || 'rx-701'}/pharmacy`)}
              className="flex-1 bg-[#d2e6e8] text-[#004e59] py-2 rounded-lg text-xs font-semibold hover:bg-[#d8dadb] transition-colors min-h-[44px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">local_pharmacy</span>
              Send to pharmacy
            </button>
          </div>
        </section>

        {/* Care Circle & Family Health Widget */}
        <CareCircleWidget
          members={memberList}
          activeMemberId={activeMemberId}
          onSelectMember={(id) => setActiveMemberId(id)}
          onViewJourney={(id) => nav.navigate(`/patient-journey/${id}`)}
          onManageCareCircle={() => nav.navigate('/care-circle')}
          onAddMember={() => setIsAddMemberModalOpen(true)}
        />

        {/* Clinic Support Strip - Stitch Exact Design */}
        <section className="bg-[#f1f4f5] rounded-[16px] p-4 flex items-center justify-between border border-[#bec8cb]/20 mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#3f484a] uppercase tracking-wider mb-1">
              Balaji Heart Center Clinic
            </span>
            <span className="text-xs text-[#181c1d]">Open today: 8 AM - 8 PM</span>
            <a href="tel:+918001234567" className="text-xs text-[#004e59] font-medium mt-1 flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-[14px]">call</span>
              +91 800 123 4567
            </a>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#004e59] border border-[#bec8cb]/30 hover:bg-[#f7fafa] transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions
            </span>
          </a>
        </section>
      </ScreenContainer>

      {/* Emergency Help Bottom Sheet */}
      <EmergencyHelpSheet
        isOpen={isEmergencySheetOpen}
        onClose={() => setIsEmergencySheetOpen(false)}
        careMembers={memberList}
        activePatientId={activeMemberId}
        onSelectPatient={(id) => setActiveMemberId(id)}
      />

      {/* Add Family Member Modal */}
      <AddCareMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={(newMember: CareMember) => addMember(newMember)}
      />
    </div>
  );
};

