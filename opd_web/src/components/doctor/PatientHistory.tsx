import { useClinicData, Appointment } from '@/contexts/ClinicDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Calendar, Pill, AlertCircle } from 'lucide-react';

interface PatientHistoryProps {
  selectedAppointment: Appointment | null;
}

export function PatientHistory({ selectedAppointment }: PatientHistoryProps) {
  const { getPatientAppointments, getPatientPrescriptions, patients } = useClinicData();

  const patient = selectedAppointment?.patient;
  const appointments = patient ? getPatientAppointments(patient.id) : [];
  const prescriptions = patient ? getPatientPrescriptions(patient.id) : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!selectedAppointment) {
    return (
      <div className="medical-section">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Select a patient to view history
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Go to "Today's Patients" and click "History" on any patient
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Patient History</h2>
      </div>

      {/* Patient Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {patient?.firstName} {patient?.lastName}
              </h3>
              <p className="text-muted-foreground font-mono">{patient?.mrNumber}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{patient?.gender}</span>
                {patient?.phone && <span>• {patient.phone}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Visit History
            <Badge variant="secondary" className="ml-2">
              {appointments.length} visits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No previous visits</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(apt.date)}</p>
                      <p className="text-sm text-muted-foreground">{apt.time} - {apt.doctorName}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      apt.status === 'completed'
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-warning/20 text-warning border-warning/30'
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Past Prescriptions
            <Badge variant="secondary" className="ml-2">
              {prescriptions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No prescriptions on record</p>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <p className="font-semibold">{rx.diagnosis}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(rx.createdAt)} • {rx.doctorName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Medicines:</p>
                    {rx.medicines.map((med, idx) => (
                      <div key={idx} className="flex items-center gap-2 pl-4 text-sm">
                        <Pill className="w-3 h-3 text-accent" />
                        <span className="font-medium">{med.name}</span>
                        <span className="text-muted-foreground">
                          - {med.dosage}, {med.frequency} for {med.duration}
                        </span>
                      </div>
                    ))}
                  </div>

                  {rx.notes && (
                    <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                      <strong>Notes:</strong> {rx.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
