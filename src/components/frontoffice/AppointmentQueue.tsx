import { useState } from 'react';
import { useClinicData, Appointment, LabQueueItem, PharmacyQueueItem } from '@/contexts/ClinicDataContext';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Phone, TestTube, Pill, Stethoscope, Plus, MessageSquare, Mail, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AppointmentQueue() {
  const {
    getTodayAppointments,
    updateAppointmentStatus,
    addBufferTime,
    labQueue,
    pharmacyQueue,
    updateLabQueueStatus,
    updatePharmacyQueueStatus,
    refreshAppointments,
  } = useClinicData();
  const { announcePatientCall, announceLabCall, announcePharmacyCall } = useVoiceAnnouncement();
  const { toast } = useToast();

  const [activeQueue, setActiveQueue] = useState<'main' | 'lab' | 'pharmacy'>('main');
  const [callingId, setCallingId] = useState<string | null>(null);

  const todayAppointments = getTodayAppointments();
  const waitingAppointments = todayAppointments.filter(a => a.status === 'waiting');
  const inProgressAppointments = todayAppointments.filter(a => a.status === 'in-progress');
  const completedAppointments = todayAppointments.filter(a => a.status === 'completed');

  // Derive "Now Serving" from DB state — the first in-progress appointment
  const currentPatient = inProgressAppointments[0] || null;
  const hasPatientInProgress = inProgressAppointments.length > 0;

  const handleCall = async (appointment: Appointment) => {
    if (hasPatientInProgress) {
      toast({
        title: 'Cannot Call',
        description: 'Doctor must complete the current consultation before calling next patient.',
        variant: 'destructive',
      });
      return;
    }

    setCallingId(appointment.id);
    try {
      await updateAppointmentStatus(appointment.id, 'in-progress');
      await refreshAppointments();

      const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      const roomNumber = appointment.room || '-';
      const opNumber = appointment.opNumber || `OP-${appointment.tokenNumber}`;

      announcePatientCall(opNumber, patientName, roomNumber);

      toast({
        title: 'Patient Called',
        description: `${patientName} has been called to Room ${roomNumber}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to call patient. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCallingId(null);
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

  const handleLabCall = async (item: LabQueueItem) => {
    try {
      await updateLabQueueStatus(item.id, 'in-progress');
      announceLabCall(item.opNumber, item.patientName);
    } catch {
      toast({ title: 'Error', description: 'Failed to update lab queue status', variant: 'destructive' });
    }
  };

  const handleLabComplete = async (id: string) => {
    try {
      await updateLabQueueStatus(id, 'completed');
    } catch {
      toast({ title: 'Error', description: 'Failed to complete lab item', variant: 'destructive' });
    }
  };

  const handlePharmacyCall = async (item: PharmacyQueueItem) => {
    try {
      await updatePharmacyQueueStatus(item.id, 'in-progress');
      announcePharmacyCall(item.opNumber, item.patientName);
    } catch {
      toast({ title: 'Error', description: 'Failed to update pharmacy queue status', variant: 'destructive' });
    }
  };

  const handlePharmacyDispense = async (id: string) => {
    try {
      await updatePharmacyQueueStatus(id, 'completed');
    } catch {
      toast({ title: 'Error', description: 'Failed to dispense pharmacy item', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string, queueType: 'main' | 'lab' | 'pharmacy' = 'main') => {
    switch (status) {
      case 'waiting':
        if (queueType === 'lab' || queueType === 'pharmacy') {
          return <Badge className="bg-warning/20 text-warning border-warning/30 font-bold">Pending</Badge>;
        }
        return <Badge className="bg-warning/20 text-warning border-warning/30 font-bold">Waiting</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30 font-bold">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="font-bold">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="medical-section space-y-6">
      {/* Now Serving Banner - Driven by DB state (in-progress appointment) */}
      {currentPatient && (
        <div className="now-serving-banner flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm opacity-80">Now Serving</p>
              <p className="text-3xl font-bold">
                {currentPatient.opNumber || `OP-${currentPatient.tokenNumber}`}
              </p>
            </div>
            <div className="h-12 w-px bg-white/30" />
            <div>
              <p className="text-sm opacity-80">Patient Name</p>
              <p className="text-2xl font-bold">
                {currentPatient.patient.firstName} {currentPatient.patient.lastName}
              </p>
            </div>
            <div className="h-12 w-px bg-white/30" />
            <div>
              <p className="text-sm opacity-80">Room Number</p>
              <p className="text-2xl font-bold">{currentPatient.room || '-'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Queue Management</h2>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Waiting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressAppointments.length}</p>
                <p className="text-sm text-muted-foreground">In Consultation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/30 hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <TestTube className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{labQueue.filter(l => l.status !== 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Lab Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/30 hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pharmacyQueue.filter(p => p.status !== 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Pharmacy Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Tabs value={activeQueue} onValueChange={(v) => setActiveQueue(v as typeof activeQueue)}>
        <TabsList className="h-12">
          <TabsTrigger value="main" className="gap-2 font-bold text-base h-10">
            <Stethoscope className="w-4 h-4" />
            Main Queue ({waitingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="lab" className="gap-2 font-bold text-base h-10">
            <TestTube className="w-4 h-4" />
            Lab Queue ({labQueue.filter(l => l.status !== 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="pharmacy" className="gap-2 font-bold text-base h-10">
            <Pill className="w-4 h-4" />
            Pharmacy Queue ({pharmacyQueue.filter(p => p.status !== 'completed').length})
          </TabsTrigger>
        </TabsList>

        {/* Main Queue Tab */}
        <TabsContent value="main" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Main Queue
                <Badge className="ml-2">{todayAppointments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      <TableHead className="font-bold text-primary">OP Number</TableHead>
                      <TableHead className="font-bold text-primary">MR Number</TableHead>
                      <TableHead className="font-bold text-primary">Patient Name</TableHead>
                      <TableHead className="font-bold text-primary">Room</TableHead>
                      <TableHead className="font-bold text-primary">Waiting Time</TableHead>
                      <TableHead className="font-bold text-primary">Status</TableHead>
                      <TableHead className="font-bold text-primary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No patients in queue
                        </TableCell>
                      </TableRow>
                    ) : (
                      todayAppointments.map((appointment) => (
                        <TableRow key={appointment.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold text-accent">
                            {appointment.opNumber || `OP-${appointment.tokenNumber}`}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {appointment.patient.mrNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </TableCell>
                          <TableCell>{appointment.room || '-'}</TableCell>
                          <TableCell>
                            {(appointment.status === 'waiting' || appointment.status === 'in-progress') ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {appointment.waitingTime || 0} min
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {appointment.status === 'waiting' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-destructive hover:bg-destructive/90 font-bold hover:scale-105 transition-transform"
                                    onClick={() => handleCall(appointment)}
                                    disabled={hasPatientInProgress || callingId === appointment.id}
                                    title={hasPatientInProgress ? 'Doctor must complete the current consultation first' : 'Call patient'}
                                  >
                                    <Phone className="w-3 h-3" />
                                    {callingId === appointment.id ? 'Calling...' : 'Call'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBuffer(appointment.id)}
                                    className="gap-1 font-bold hover:bg-primary hover:text-primary-foreground"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Buffer (+5m)
                                  </Button>
                                </>
                              )}
                              {appointment.status === 'in-progress' && (
                                <span className="text-sm text-primary font-medium">With Doctor</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Queue Tab */}
        <TabsContent value="lab" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Lab Queue
                <Badge className="ml-2">{labQueue.filter(l => l.status !== 'completed').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      <TableHead className="font-bold text-primary">OP Number</TableHead>
                      <TableHead className="font-bold text-primary">Patient Name</TableHead>
                      <TableHead className="font-bold text-primary">Test Name</TableHead>
                      <TableHead className="font-bold text-primary">Status</TableHead>
                      <TableHead className="font-bold text-primary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labQueue.filter(l => l.status !== 'completed').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No patients in lab queue
                        </TableCell>
                      </TableRow>
                    ) : (
                      labQueue.filter(l => l.status !== 'completed').map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold text-accent">
                            {item.opNumber}
                          </TableCell>
                          <TableCell className="font-medium">{item.patientName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.labTests.join(', ')}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status, 'lab')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.status === 'waiting' && (
                                <Button
                                  size="sm"
                                  className="gap-1 bg-primary hover:bg-primary/90 font-bold"
                                  onClick={() => handleLabCall(item)}
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Collected
                                </Button>
                              )}
                              {item.status === 'in-progress' && (
                                <Button
                                  size="sm"
                                  className="gap-1 bg-success hover:bg-success/90 font-bold"
                                  onClick={() => handleLabComplete(item.id)}
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Complete
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-success hover:text-success">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pharmacy Queue Tab */}
        <TabsContent value="pharmacy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Pharmacy Queue
                <Badge className="ml-2">{pharmacyQueue.filter(p => p.status !== 'completed').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      <TableHead className="font-bold text-primary">OP Number</TableHead>
                      <TableHead className="font-bold text-primary">Patient Name</TableHead>
                      <TableHead className="font-bold text-primary">Medicines</TableHead>
                      <TableHead className="font-bold text-primary">Status</TableHead>
                      <TableHead className="font-bold text-primary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacyQueue.filter(p => p.status !== 'completed').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No patients in pharmacy queue
                        </TableCell>
                      </TableRow>
                    ) : (
                      pharmacyQueue.filter(p => p.status !== 'completed').map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold text-accent">
                            {item.opNumber}
                          </TableCell>
                          <TableCell className="font-medium">{item.patientName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.medicines.join(', ')}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status, 'pharmacy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.status === 'waiting' && (
                                <Button
                                  size="sm"
                                  className="gap-1 bg-success hover:bg-success/90 font-bold"
                                  onClick={() => handlePharmacyCall(item)}
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Dispensed
                                </Button>
                              )}
                              {item.status === 'in-progress' && (
                                <Button
                                  size="sm"
                                  className="gap-1 bg-success hover:bg-success/90 font-bold"
                                  onClick={() => handlePharmacyDispense(item.id)}
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Dispense
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-success hover:text-success">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
