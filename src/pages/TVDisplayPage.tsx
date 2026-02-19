import { useEffect, useState, useRef } from 'react';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { RefreshCw, Volume2 } from 'lucide-react';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import logo from '@/assets/logo.jpeg';

export default function TVDisplayPage() {
  const { getTodayAppointments } = useClinicData();
  const { announcePatientCall, teluguVoiceAvailable, teluguVoiceName } = useVoiceAnnouncement();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const announcementIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  const inProgressPatients = todayAppointments.filter(a => a.status === 'in-progress');

  // Get the first in-progress patient for announcements (legacy support)
  const currentPatient = inProgressPatients[0] || null;

  // Voice announcement - announce when patient changes and repeat every 5 minutes
  useEffect(() => {
    // Clear any existing interval
    if (announcementIntervalRef.current) {
      clearInterval(announcementIntervalRef.current);
      announcementIntervalRef.current = null;
    }

    if (!currentPatient) {
      setLastAnnouncedId(null);
      return;
    }

    const opNumber = currentPatient.opNumber || `OP-${currentPatient.tokenNumber}`;
    const patientName = `${currentPatient.patient.firstName} ${currentPatient.patient.lastName}`;
    const roomNumber = currentPatient.room || '1';

    const makeAnnouncement = async () => {
      setIsAnnouncing(true);
      await announcePatientCall(opNumber, patientName, roomNumber);
      setIsAnnouncing(false);
    };

    // Announce immediately when a new patient is called
    if (currentPatient.id !== lastAnnouncedId) {
      makeAnnouncement();
      setLastAnnouncedId(currentPatient.id);
    }

    // Set up 5-minute repeat interval
    announcementIntervalRef.current = setInterval(() => {
      makeAnnouncement();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (announcementIntervalRef.current) {
        clearInterval(announcementIntervalRef.current);
      }
    };
  }, [currentPatient?.id, todayAppointments, announcePatientCall, lastAnnouncedId]);

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

  // Combine all patients for the queue display: in-progress first, then waiting
  const allQueuePatients = [...inProgressPatients, ...waitingPatients];

  // Helper to get row background style based on position and status
  const getRowStyle = (index: number, status: string) => {
    // 1st patient (Calling / In Consultation) - Orange
    if (index === 0 && (status === 'in-progress' || status === 'calling')) {
      return 'bg-orange-500 text-black font-bold';
    }
    // 2nd patient (Next to be called / Ready) - Yellow
    if (index === 1) {
      return 'bg-yellow-400 text-black font-bold';
    }
    // Remaining patients - Black with white text
    return 'bg-black text-white';
  };

  // Helper to get status display text
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
          <div className="flex items-center gap-2 mt-1">
            {teluguVoiceAvailable ? (
              <span className="text-green-400 text-xs">Voice: {teluguVoiceName}</span>
            ) : (
              <span className="text-red-400 text-xs">Telugu voice not found!</span>
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
                  const eta = apt.waitingTime !== undefined ? `${apt.waitingTime} min` : (index === 0 ? '0 min' : `${index * 5} min`);

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
