import { useEffect, useState, useRef } from 'react';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, Stethoscope, RefreshCw, Volume2 } from 'lucide-react';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import logo from '@/assets/logo.jpeg';

export default function TVDisplayPage() {
  const { getTodayAppointments } = useClinicData();
  const { announcePatientCall } = useVoiceAnnouncement();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
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
  
  // Get only the first patient with doctor (one record)
  const currentPatient = inProgressPatients[0] || null;

  // Voice announcement - announce when patient changes and repeat every 5 minutes
  useEffect(() => {
    // Clear any existing interval
    if (announcementIntervalRef.current) {
      clearInterval(announcementIntervalRef.current);
      announcementIntervalRef.current = null;
    }

    if (!currentPatient || !voiceEnabled) {
      setLastAnnouncedId(null);
      return;
    }

    const tokenNumber = String(todayAppointments.findIndex(a => a.id === currentPatient.id) + 1);
    const patientName = `${currentPatient.patient.firstName} ${currentPatient.patient.lastName}`;
    const roomNumber = currentPatient.room || '1';

    const makeAnnouncement = async () => {
      setIsAnnouncing(true);
      await announcePatientCall(tokenNumber, patientName, roomNumber);
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
  }, [currentPatient?.id, todayAppointments, announcePatientCall, lastAnnouncedId, voiceEnabled]);

  const handleEnableVoice = async () => {
    // Browsers often block speech until a user gesture occurs.
    // This click unlocks speech synthesis for the page.
    setVoiceEnabled(true);
    if (currentPatient) {
      const tokenNumber = String(todayAppointments.findIndex(a => a.id === currentPatient.id) + 1);
      const patientName = `${currentPatient.patient.firstName} ${currentPatient.patient.lastName}`;
      const roomNumber = currentPatient.room || '1';
      setIsAnnouncing(true);
      await announcePatientCall(tokenNumber, patientName, roomNumber);
      setIsAnnouncing(false);
      setLastAnnouncedId(currentPatient.id);
    }
  };

  const generateOPNumber = (id: string) => {
    const index = todayAppointments.findIndex(a => a.id === id) + 1;
    return String(index);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('te-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('te-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Balaji Heart Center" className="h-16 rounded-lg" />
        </div>

        {/* Center - Now Serving */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-amber-400" />
            <h2 className="text-4xl font-bold text-amber-400">ప్రస్తుతం సేవ</h2>
            <span className="text-xl text-slate-400">(Now Serving)</span>
            {isAnnouncing && (
              <Volume2 className="w-6 h-6 text-amber-400 animate-pulse" />
            )}
          </div>
          {!voiceEnabled && (
            <button
              type="button"
              onClick={handleEnableVoice}
              className="mt-3 px-6 py-2 rounded-md bg-[#b23438] text-white text-lg font-bold hover:bg-[#9a2c30] transition-colors"
            >
              Enable Voice / వాయిస్ ఆన్ చేయండి
            </button>
          )}
        </div>

        {/* Right - Time */}
        <div className="text-right">
          <div className="text-5xl font-bold text-teal-400 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-lg text-slate-300 mt-1">
            {formatDate(currentTime)}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 justify-end">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            Auto-refresh
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column - Current Patient and Stats */}
        <div className="w-1/2 flex flex-col gap-4">
          {/* Current Patient - Main focus */}
          {!currentPatient ? (
            <Card className="p-6 text-center bg-slate-800/50 border-slate-600">
              <p className="text-2xl text-slate-400">ప్రస్తుతం ఎవరూ లేరు</p>
              <p className="text-lg text-slate-500 mt-1">(No patients currently)</p>
            </Card>
          ) : (
            <Card
              className="p-6 bg-gradient-to-r from-teal-800 to-teal-900 border-teal-500/50"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center text-4xl font-bold flex-shrink-0">
                  {generateOPNumber(currentPatient.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-3xl font-bold text-white truncate">
                    {currentPatient.patient.firstName} {currentPatient.patient.lastName}
                  </p>
                  <p className="text-xl text-slate-300 font-mono mt-1">
                    {currentPatient.patient.mrNumber}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge className="text-2xl px-4 py-2 bg-[#b23438] text-white border-0">
                    Room {currentPatient.room || '1'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <Card className="p-4 bg-amber-900/50 border-amber-500/50 flex items-center gap-4 flex-1">
              <Clock className="w-10 h-10 text-amber-400" />
              <div>
                <p className="text-4xl font-bold text-amber-400">{waitingPatients.length}</p>
                <p className="text-lg text-amber-200">వేచి ఉన్నారు (Waiting)</p>
              </div>
            </Card>
            <Card className="p-4 bg-teal-900/50 border-teal-500/50 flex items-center gap-4 flex-1">
              <Stethoscope className="w-10 h-10 text-teal-400" />
              <div>
                <p className="text-4xl font-bold text-teal-400">{inProgressPatients.length}</p>
                <p className="text-lg text-teal-200">డాక్టర్ దగ్గర (With Doctor)</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column - Waiting Queue */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-amber-400">వేచి ఉన్న క్యూ</h3>
            <span className="text-lg text-slate-400">(Waiting Queue)</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {waitingPatients.length === 0 ? (
              <Card className="p-6 text-center bg-slate-800/50 border-slate-600">
                <p className="text-xl text-slate-400">వేచి ఉన్న రోగులు లేరు</p>
                <p className="text-lg text-slate-500">(No waiting patients)</p>
              </Card>
            ) : (
              waitingPatients.map((apt, index) => (
                <Card key={apt.id} className="p-3 bg-slate-800/50 border-slate-600 hover:border-amber-500/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {todayAppointments.findIndex(a => a.id === apt.id) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-white truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <p className="text-sm text-slate-400 font-mono">{apt.patient.mrNumber}</p>
                    </div>
                    <p className="text-sm text-slate-400 flex-shrink-0">{apt.waitingTime || (index + 1) * 15} min</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-800 text-white py-4 px-6 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <p className="text-lg font-semibold">
            దయచేసి మీ పేరు పిలిచే వరకు వేచి ఉండండి 
            <span className="text-slate-300 ml-2">(Please wait for your name to be called)</span>
          </p>
          <p className="text-lg font-bold">
            Emergency: 108 | Clinic: +91 9100079990 / 9010278278
          </p>
        </div>
      </div>
    </div>
  );
}
