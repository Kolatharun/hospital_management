import { useEffect, useState, useRef } from 'react';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { RefreshCw, Volume2 } from 'lucide-react';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import appointmentService from '@/services/appointmentService';
import logo from '@/assets/logo.jpeg';

export default function TVDisplayPage() {
  const { getTodayAppointments, refreshAppointments } = useClinicData();
  const { announcePatientCall, stopAudio, teluguVoiceAvailable, englishVoiceAvailable, teluguVoiceName, englishVoiceName } = useVoiceAnnouncement();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // Track which appointment is currently being announced (prevents race conditions)
  const currentlyAnnouncingIdRef = useRef<string | null>(null);
  // Track appointments we've already triggered announcements for (prevents duplicate triggers)
  const triggeredAnnouncementsRef = useRef<Set<string>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const refreshInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const todayAppointments = getTodayAppointments();
  const waitingPatients = todayAppointments.filter(a => a.status === 'waiting');
  // Include both 'calling' and 'in-progress' as active patients
  const inProgressPatients = todayAppointments.filter(a => a.status === 'in-progress' || (a.status as string) === 'calling');

  // Voice announcement effect - uses backend tracking (refresh-safe, multi-TV safe)
  useEffect(() => {
    // Find a patient who needs announcement: status is 'calling' or 'in-progress' but not yet announced
    // We check both statuses because 'calling' can quickly change to 'in-progress'
    const patientNeedingAnnouncement = todayAppointments.find(
      apt => ((apt.status as string) === 'calling' || apt.status === 'in-progress') &&
             !apt.announcementPlayed &&
             !triggeredAnnouncementsRef.current.has(apt.id)
    );

    // If we're already announcing any patient, don't start a new one
    if (currentlyAnnouncingIdRef.current !== null) {
      return;
    }

    // If no patient needs announcement, just return (don't clear interval - it manages itself)
    if (!patientNeedingAnnouncement) {
      return;
    }

    // Capture patient info at trigger time - announcement will complete with these values
    // regardless of any subsequent status changes
    const appointmentId = patientNeedingAnnouncement.id;
    const opNumber = patientNeedingAnnouncement.opNumber || `OP-${patientNeedingAnnouncement.tokenNumber}`;
    const patientName = `${patientNeedingAnnouncement.patient.firstName} ${patientNeedingAnnouncement.patient.lastName}`;
    const roomNumber = patientNeedingAnnouncement.room || '1';

    // Lock this patient for announcement (do NOT add to triggered set yet - only after voice success)
    currentlyAnnouncingIdRef.current = appointmentId;
    setIsAnnouncing(true);

    // Start announcement - only mark as played AFTER voice completes successfully
    announcePatientCall(opNumber, patientName, roomNumber)
      .then(() => {
        // Voice played successfully - now mark as announced in backend
        console.log('[Announcement] Voice completed, marking as played:', appointmentId);
        triggeredAnnouncementsRef.current.add(appointmentId);
        return appointmentService.markAnnouncementPlayed(appointmentId);
      })
      .then(() => refreshAppointments())
      .catch((error) => {
        // If skipped due to concurrent announcement, don't add to triggered set (allow retry)
        if (error?.message === 'ANNOUNCEMENT_SKIPPED') {
          console.log('[Announcement] Skipped (concurrent), will retry later:', appointmentId);
        } else {
          // Other errors - log but don't mark as played (voice didn't complete)
          console.error('[Announcement] Error (voice not played):', error);
        }
      })
      .finally(() => {
        currentlyAnnouncingIdRef.current = null;
        setIsAnnouncing(false);
      });
  }, [refreshKey, todayAppointments, announcePatientCall, refreshAppointments]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const allQueuePatients = [...inProgressPatients, ...waitingPatients];

  const getRowStyle = (index: number, status: string) => {
    if (index === 0 && (status === 'in-progress' || status === 'calling')) {
      return 'bg-orange-500 text-black font-bold';
    }
    if (index === 1) {
      return 'bg-yellow-400 text-black font-bold';
    }
    return 'bg-black text-white';
  };

  const getStatusText = (status: string, index: number) => {
    if (status === 'in-progress') return 'Calling';
    if (status === 'calling') return 'Calling';
    if (index === 1) return 'Next';
    return 'Waiting';
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 flex-shrink-0">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Balaji Heart Center" className="h-14 rounded-lg" />
        </div>

        {/* Center - Title */}
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-4xl font-bold italic text-green-400 tracking-wide">
            Outpatient Queue Display
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
            {teluguVoiceAvailable ? (
              <span className="text-green-400 text-xs">Telugu: {teluguVoiceName}</span>
            ) : (
              <span className="text-red-400 text-xs">Telugu voice not found!</span>
            )}
            <span className="text-slate-500 text-xs">|</span>
            {englishVoiceAvailable ? (
              <span className="text-green-400 text-xs">English: {englishVoiceName}</span>
            ) : (
              <span className="text-red-400 text-xs">English voice not found!</span>
            )}
          </div>
          {isAnnouncing && (
            <div className="flex items-center gap-2 mt-1">
              <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm">Announcing...</span>
            </div>
          )}
        </div>

        {/* Right - Time */}
        <div className="text-right">
          <div className="text-3xl font-bold text-teal-400 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-slate-300">
            {formatDate(currentTime)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 justify-end">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
            Auto-refresh
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Table */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-y-auto">
          <table className="w-full border-collapse text-xl">
            {/* Table Header */}
            <thead className="sticky top-0">
              <tr className="bg-slate-700 text-slate-100">
                <th className="py-4 px-6 text-left font-bold text-2xl border-b-2 border-slate-500">Token</th>
                <th className="py-4 px-6 text-left font-bold text-2xl border-b-2 border-slate-500">Patient</th>
                <th className="py-4 px-6 text-center font-bold text-2xl border-b-2 border-slate-500">Doctor</th>
                <th className="py-4 px-6 text-center font-bold text-2xl border-b-2 border-slate-500">Room</th>
                <th className="py-4 px-6 text-center font-bold text-2xl border-b-2 border-slate-500">Status</th>
                <th className="py-4 px-6 text-center font-bold text-2xl border-b-2 border-slate-500">ETA</th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {allQueuePatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-2xl text-slate-400">
                    No patients in queue
                  </td>
                </tr>
              ) : (
                allQueuePatients.map((apt, index) => {
                  const opNumber = apt.opNumber || `D${apt.tokenNumber || (todayAppointments.findIndex(a => a.id === apt.id) + 1)}`;
                  const patientName = `${apt.patient.firstName} ${apt.patient.lastName}`.toLowerCase();
                  const doctorName = apt.doctorName || 'Doctor';
                  const roomNumber = apt.room || '1';
                  const status = getStatusText(apt.status, index);

                  // ETA display based on status
                  const getEtaDisplay = (): string => {
                    const aptStatus = apt.status as string;
                    if (aptStatus === 'in-progress') {
                      return '-';
                    }
                    if (aptStatus === 'calling') {
                      return '0 min';
                    }
                    // status === 'waiting' - show raw waitingTime + bufferTime from backend
                    const waiting = Number(apt.waitingTime ?? 0);
                    const buffer = Number(apt.bufferTime ?? 0);
                    return `${waiting + buffer} min`;
                  };
                  const eta = getEtaDisplay();

                  return (
                    <tr
                      key={apt.id}
                      className={`${getRowStyle(index, apt.status)} border-b border-slate-700 transition-colors`}
                    >
                      <td className="py-5 px-6 text-2xl font-bold">{opNumber}</td>
                      <td className="py-5 px-6 text-2xl">{patientName}</td>
                      <td className="py-5 px-6 text-2xl text-center">{doctorName}</td>
                      <td className="py-5 px-6 text-2xl text-center">{roomNumber}</td>
                      <td className="py-5 px-6 text-2xl text-center font-semibold">{status}</td>
                      <td className="py-5 px-6 text-2xl text-center">{eta}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 text-white py-3 px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-base">
            Please wait for your name to be called
          </p>
          <p className="text-base font-bold">
            Emergency: 108 | Clinic: +91 9100079990 / 9010278278
          </p>
        </div>
      </div>
    </div>
  );
}
