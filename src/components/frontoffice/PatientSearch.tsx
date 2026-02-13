import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Phone, Calendar, MapPin, FileText, History, Download, Pill, Eye, Loader2 } from 'lucide-react';
import { patientService, Patient } from '@/services/patientService';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { documentService, Document } from '@/services/documentService';
import { prescriptionService, Prescription, getPrescriptionPdfUrl } from '@/services/prescriptionService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const getDocumentFileUrl = (documentId: string, download = false): string => {
  if (!documentId) return '';
  const token = localStorage.getItem('access_token');
  const baseUrl = `${API_BASE_URL}/documents/${documentId}/file`;
  const params = new URLSearchParams();
  if (token) params.append('token', token);
  if (download) params.append('download', 'true');
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export function PatientSearch() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [documentPreview, setDocumentPreview] = useState<Document | null>(null);

  // Patient details state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionPreview, setPrescriptionPreview] = useState<Prescription | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Enter search query',
        description: 'Please enter a name, phone number, or MR number to search.',
        variant: 'destructive',
      });
      return;
    }

    setHasSearched(true);
    setIsSearching(true);

    try {
      const response = await patientService.search(query);
      setResults(response.patients);
      setTotalResults(response.total);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search patients. Please try again.',
        variant: 'destructive',
      });
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);
    setActiveTab('history');

    try {
      const [appointmentsData, documentsData, prescriptionsData] = await Promise.all([
        appointmentService.getPatientAppointments(patient.id),
        documentService.getPatientDocuments(patient.id),
        prescriptionService.getPatientPrescriptions(patient.id),
      ]);

      setAppointments(appointmentsData);
      setDocuments(documentsData.items);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Failed to load patient details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewDocument = (doc: Document) => {
    setDocumentPreview(doc);
  };

  const handleDownloadDocument = (doc: Document) => {
    const url = getDocumentFileUrl(doc.id, true);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewPrescription = (rx: Prescription) => {
    setPrescriptionPreview(rx);
  };

  const handleDownloadPrescription = (rx: Prescription) => {
    const url = getPrescriptionPdfUrl(rx.id, true);
    const link = document.createElement('a');
    link.href = url;
    link.download = rx.op_number ? `${rx.op_number}.pdf` : `prescription_${rx.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Patient Search</h2>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone number, or MR number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2 font-bold hover:scale-[1.02] transition-transform"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Search Results
              {totalResults > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalResults} found)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patients found matching "{query}"
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      <TableHead className="font-bold text-primary">MR Number</TableHead>
                      <TableHead className="font-bold text-primary">Patient Name</TableHead>
                      <TableHead className="font-bold text-primary">Phone</TableHead>
                      <TableHead className="font-bold text-primary">Gender</TableHead>
                      <TableHead className="font-bold text-primary">Registered</TableHead>
                      <TableHead className="font-bold text-primary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">
                          {patient.mr_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{formatDate(patient.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectPatient(patient)}
                            className="font-bold hover:bg-primary hover:text-primary-foreground"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient Details Dialog with Tabs */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Details
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              {/* Patient Info Header */}
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedPatient.mr_number}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{selectedPatient.gender}</span>
                      <span>•</span>
                      <span>{selectedPatient.phone}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {appointments.length} visit(s)
                    </p>
                    <p className="text-muted-foreground">
                      {prescriptions.length} prescription(s)
                    </p>
                  </div>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-4 h-12">
                    <TabsTrigger value="history" className="gap-2 font-bold">
                      <History className="w-4 h-4" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2 font-bold">
                      <FileText className="w-4 h-4" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions" className="gap-2 font-bold">
                      <Pill className="w-4 h-4" />
                      Prescriptions
                    </TabsTrigger>
                    <TabsTrigger value="info" className="gap-2 font-bold">
                      <User className="w-4 h-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>

                  {/* History Tab */}
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-3">
                      {appointments.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No visit history</p>
                      ) : (
                        appointments.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{formatDate(apt.appointment_date)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {apt.appointment_time || 'N/A'} - {apt.doctor_name || 'Doctor'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={
                                apt.status === 'completed'
                                  ? 'bg-success/20 text-success border-success/30 font-bold'
                                  : 'bg-warning/20 text-warning border-warning/30 font-bold'
                              }
                            >
                              {apt.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="mt-4">
                    <div className="space-y-3">
                      {documents.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No documents uploaded</p>
                      ) : (
                        documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.document_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.file_name} • {formatDate(doc.created_at)}
                                  {doc.uploaded_by_name && ` • Uploaded by ${doc.uploaded_by_name}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(doc)}
                                className="gap-1 font-bold"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDocument(doc)}
                                className="gap-1 font-bold"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Prescriptions Tab */}
                  <TabsContent value="prescriptions" className="mt-4">
                    <div className="space-y-4">
                      {prescriptions.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No prescriptions on record</p>
                      ) : (
                        prescriptions.map((rx) => (
                          <Card key={rx.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-primary" />
                                    <p className="font-semibold">{rx.diagnosis || 'General Prescription'}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{rx.op_number || rx.id.substring(0, 8)}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formatDate(rx.created_at)} • {rx.doctor_name || 'Doctor'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewPrescription(rx)}
                                    className="gap-1 font-bold"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadPrescription(rx)}
                                    className="gap-1 font-bold"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              {rx.medicines && rx.medicines.length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground">Medicines:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {rx.medicines.map((med, idx) => (
                                      <Badge key={idx} variant="secondary" className="font-medium">
                                        {med.medicine_name} - {med.dosage}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Info Tab */}
                  <TabsContent value="info" className="mt-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedPatient.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="font-medium">{selectedPatient.gender}</p>
                        </div>
                      </div>
                      {selectedPatient.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date of Birth</p>
                            <p className="font-medium">{formatDate(selectedPatient.date_of_birth)}</p>
                          </div>
                        </div>
                      )}
                      {selectedPatient.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <p className="font-medium">{selectedPatient.address}</p>
                          </div>
                        </div>
                      )}
                      <div className="col-span-2 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Registered on {formatDate(selectedPatient.created_at)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!documentPreview} onOpenChange={() => setDocumentPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {documentPreview?.document_type} - {documentPreview?.file_name}
              </span>
            </DialogTitle>
          </DialogHeader>
          {documentPreview && (
            <div className="min-h-[400px] bg-muted rounded-lg overflow-hidden">
              {documentPreview.file_type?.startsWith('image') ? (
                <img
                  src={getDocumentFileUrl(documentPreview.id)}
                  alt={documentPreview.file_name}
                  className="w-full max-h-[500px] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div style="display:flex;align-items:center;justify-content:center;min-height:400px;color:var(--muted-foreground)">
                        <div style="text-align:center">
                          <p>Unable to load image preview.</p>
                          <p style="font-size:0.875rem;margin-top:4px">The file may have been moved or deleted.</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              ) : documentPreview.file_type === 'application/pdf' ? (
                <iframe
                  src={getDocumentFileUrl(documentPreview.id)}
                  title={documentPreview.file_name}
                  className="w-full h-[500px]"
                />
              ) : (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>Preview not available for this file type</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDocumentPreview(null)} className="font-bold">
              Close
            </Button>
            {documentPreview && (
              <Button
                onClick={() => handleDownloadDocument(documentPreview)}
                className="gap-2 font-bold"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Preview Dialog */}
      <Dialog open={!!prescriptionPreview} onOpenChange={() => setPrescriptionPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Prescription Details
            </DialogTitle>
          </DialogHeader>
          {prescriptionPreview && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-muted">
                <iframe
                  src={getPrescriptionPdfUrl(prescriptionPreview.id)}
                  title={`Prescription - ${prescriptionPreview.op_number || prescriptionPreview.id}`}
                  className="w-full h-[600px]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setPrescriptionPreview(null)} className="font-bold">
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadPrescription(prescriptionPreview)}
                  className="gap-2 font-bold"
                >
                  <Download className="w-4 h-4" />
                  Download / Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
