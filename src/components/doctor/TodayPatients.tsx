import { useClinicData, Appointment } from '@/contexts/ClinicDataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Clock, Eye, Stethoscope } from 'lucide-react';

interface TodayPatientsProps {
  onStartConsultation: (appointment: Appointment) => void;
  onViewHistory: (appointment: Appointment) => void;
}

export function TodayPatients({ onStartConsultation, onViewHistory }: TodayPatientsProps) {
  const { getTodayAppointments, updateAppointmentStatus } = useClinicData();

  const todayAppointments = getTodayAppointments();
  const waitingAppointments = todayAppointments.filter(a => a.status === 'waiting' || a.status === 'in-progress');
  const completedAppointments = todayAppointments.filter(a => a.status === 'completed');

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Waiting</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/20 text-primary border-primary/30">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
      default:
        return null;
    }
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      await updateAppointmentStatus(appointment.id, 'in-progress');
      onStartConsultation(appointment);
    } catch (error) {
      console.error('Failed to start consultation:', error);
    }
  };

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Today's Patients</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Total Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Patient Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients scheduled for today
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MR Number</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-mono text-sm">
                        {appointment.patient.mrNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewHistory(appointment)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            History
                          </Button>
                          {(appointment.status === 'waiting' || appointment.status === 'in-progress') && (
                            <Button
                              size="sm"
                              onClick={() => handleStartConsultation(appointment)}
                              className="gap-1"
                            >
                              <Stethoscope className="w-3 h-3" />
                              {appointment.status === 'in-progress' ? 'Continue' : 'Start'}
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
  );
}
