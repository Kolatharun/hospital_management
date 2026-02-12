import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { PatientHistory } from '@/components/doctor/PatientHistory';
import { PrescriptionForm } from '@/components/doctor/PrescriptionForm';
import type { PrescriptionFormRef } from '@/components/doctor/PrescriptionForm';
import { useClinicData, Appointment } from '@/contexts/ClinicDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import { Users, Clock, FileText, Stethoscope, ArrowLeft, Phone, Plus, Volume2 } from 'lucide-react';

export default function DoctorDashboard() {
  const [view, setView] = useState<'dashboard' | 'prescription' | 'history'>('dashboard');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const prescriptionFormRef = useRef<PrescriptionFormRef>(null);
  const {
    getTodayAppointments,
    updateAppointmentStatus,
    addBufferTime,
    refreshAppointments,
  } = useClinicData();
  const { toast } = useToast();
  const { announcePatientCall } = useVoiceAnnouncement();

  const handleTestVoice = async () => {
    toast({
      title: 'Testing Voice',
      description: 'Playing Telugu announcement...',
    });
    await announcePatientCall('001', 'రామ కృష్ణ', '1');
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      // Only call the API if the patient is currently waiting
      if (appointment.status === 'waiting') {
        await updateAppointmentStatus(appointment.id, 'in-progress');
        await refreshAppointments();

        // Voice announcement on call
        const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
        const roomNumber = appointment.room || '1';
        const opNumber = appointment.opNumber || `OP-${appointment.tokenNumber}`;
        announcePatientCall(opNumber, patientName, roomNumber);
      }

      setSelectedAppointment(appointment);
      setView('prescription');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to start consultation',
        variant: 'destructive',
      });
    }
  };

  const handleBuffer = async (appointmentId: string) => {
    try {
      await addBufferTime(appointmentId, 5);
      toast({
        title: 'Buffer Added',
        description: '+5 minutes buffer time added.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add buffer time.',
        variant: 'destructive',
      });
    }
  };

  const handleViewHistory = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setView('history');
  };

  const handleBack = () => {
    setView('dashboard');
    setSelectedAppointment(null);
  };

  const handlePrescriptionComplete = () => {
    setView('dashboard');
    setSelectedAppointment(null);
  };

  const todayAppointments = getTodayAppointments();
  const waitingCount = todayAppointments.filter(a => a.status === 'waiting').length;
  const inProgressAppointment = todayAppointments.find(a => a.status === 'in-progress');

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Waiting</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/20 text-primary border-primary/30">In Consultation</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
      default:
        return null;
    }
  };

  if (view === 'prescription' && selectedAppointment) {
    return (
      <>
        <Header />
        <PageContainer
          title="Doctor Dashboard"
          description="Manage patient consultations and prescriptions"
        >
          <div className="space-y-4">
            {/* Top Actions Bar */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack} className="gap-2 btn-touch">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button variant="outline" className="gap-2 btn-touch" onClick={() => prescriptionFormRef.current?.openDocuments()}>
                <FileText className="w-4 h-4" />
                Documents
              </Button>
            </div>

            <PrescriptionForm
              ref={prescriptionFormRef}
              selectedAppointment={selectedAppointment}
              onComplete={handlePrescriptionComplete}
            />
          </div>
        </PageContainer>
      </>
    );
  }

  if (view === 'history' && selectedAppointment) {
    return (
      <>
        <Header />
        <PageContainer
          title="Doctor Dashboard"
          description="Manage patient consultations and prescriptions"
        >
          <div className="space-y-4">
            <Button variant="outline" onClick={handleBack} className="gap-2 btn-touch">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <PatientHistory selectedAppointment={selectedAppointment} />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header />
      <PageContainer
        title="Doctor Dashboard"
        description="Manage patient consultations and prescriptions"
      >
        <div className="space-y-6">
          {/* Current Patient Card */}
          {inProgressAppointment && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">Current Patient</h3>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">OP Number</p>
                    <p className="font-semibold font-mono">
                      {inProgressAppointment.opNumber || `OP-${inProgressAppointment.tokenNumber}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MR Number</p>
                    <p className="font-semibold font-mono">{inProgressAppointment.patient.mrNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Patient Name</p>
                    <p className="font-semibold">
                      {inProgressAppointment.patient.firstName} {inProgressAppointment.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age/Gender</p>
                    <p className="font-semibold">
                      {inProgressAppointment.patient.dateOfBirth
                        ? `${new Date().getFullYear() - new Date(inProgressAppointment.patient.dateOfBirth).getFullYear()} / `
                        : '- / '}
                      {inProgressAppointment.patient.gender}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleStartConsultation(inProgressAppointment)}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 btn-touch"
                >
                  <FileText className="w-4 h-4" />
                  Open Prescription
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Patient Queue */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Patient Queue</h3>
                  <Badge className="bg-primary text-primary-foreground">
                    {waitingCount} waiting
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestVoice}
                  className="gap-2 btn-touch"
                >
                  <Volume2 className="w-4 h-4" />
                  Test Telugu Voice
                </Button>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patients scheduled for today
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary/10 hover:bg-primary/10">
                        <TableHead className="font-bold text-foreground">OP Number</TableHead>
                        <TableHead className="font-bold text-foreground">Patient Name</TableHead>
                        <TableHead className="font-bold text-foreground">Room</TableHead>
                        <TableHead className="font-bold text-foreground">Wait Time</TableHead>
                        <TableHead className="font-bold text-foreground">Status</TableHead>
                        <TableHead className="font-bold text-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAppointments.map((appointment) => (
                        <TableRow
                          key={appointment.id}
                          className={`hover:bg-muted/50 ${appointment.status === 'in-progress' ? 'bg-primary/5' : ''}`}
                        >
                          <TableCell className="font-mono text-sm">
                            {appointment.opNumber || `OP-${appointment.tokenNumber}`}
                          </TableCell>
                          <TableCell className="font-medium">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </TableCell>
                          <TableCell>{appointment.room || '1'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {(appointment.status === 'waiting' || appointment.status === 'in-progress')
                                ? `${appointment.waitingTime || 0} min`
                                : '-'}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {appointment.status === 'waiting' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartConsultation(appointment)}
                                    className="gap-1 bg-destructive hover:bg-destructive/90 btn-touch"
                                  >
                                    <Phone className="w-3 h-3" />
                                    Call
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBuffer(appointment.id)}
                                    className="gap-1 btn-touch"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Buffer (+5m)
                                  </Button>
                                </>
                              )}
                              {appointment.status === 'in-progress' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartConsultation(appointment)}
                                    className="gap-1 btn-touch"
                                  >
                                    <FileText className="w-3 h-3" />
                                    Prescription
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBuffer(appointment.id)}
                                    className="gap-1 btn-touch"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Buffer (+5m)
                                  </Button>
                                </>
                              )}
                              {appointment.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewHistory(appointment)}
                                  className="gap-1 btn-touch"
                                >
                                  <FileText className="w-3 h-3" />
                                  View
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
