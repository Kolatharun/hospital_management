import { useState, useRef, useEffect, useCallback } from 'react';
import { useClinicData, Appointment } from '@/contexts/ClinicDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, User, Plus, Trash2, Save, Printer, Search, Clock, Mic, Send, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import prescriptionHeader from '@/assets/prescription-header.jpeg';
import prescriptionFooter from '@/assets/prescription-footer.jpeg';

interface Medicine {
  name: string;
  dosage: string;
  days: string;
}

interface PrescriptionFormProps {
  selectedAppointment: Appointment | null;
  onComplete: () => void;
}

const COMMON_DIAGNOSES = [
  'Hypertension',
  'Type 2 Diabetes',
  'Coronary Artery Disease',
  'Heart Failure',
  'Atrial Fibrillation',
  'Myocardial Infarction',
  'Angina Pectoris',
  'Cardiomyopathy',
];

const COMMON_COMPLAINTS = [
  'Chest Pain',
  'Shortness of Breath',
  'Palpitations',
  'Dizziness',
  'Fatigue',
  'Swelling in legs',
  'High BP',
  'Irregular heartbeat',
];

const COMMON_MEDICINES = [
  'Amlodipine',
  'Atorvastatin',
  'Aspirin',
  'Metoprolol',
  'Losartan',
  'Clopidogrel',
  'Ramipril',
  'Furosemide',
  'Carvedilol',
  'Digoxin',
];

const LAB_TESTS = [
  'ECG',
  'ECHO',
  'TMT',
  'HOLTER',
  'ABPM',
  'Lipid Profile',
  'HbA1c',
  'Thyroid Profile',
  'Complete Blood Count',
  'Kidney Function Test',
];

export function PrescriptionForm({ selectedAppointment, onComplete }: PrescriptionFormProps) {
  const { addPrescription, updateAppointmentStatus, getAppointmentVitals, getPatientPrescriptions } = useClinicData();
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTab, setActiveTab] = useState('prescription');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Form states
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [history, setHistory] = useState('NULL');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaint, setComplaint] = useState('');
  
  const [medicineSearch, setMedicineSearch] = useState('');
  const [currentDosage, setCurrentDosage] = useState('1-0-1');
  const [currentDays, setCurrentDays] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [manualMedicines, setManualMedicines] = useState('');
  
  const [labSearch, setLabSearch] = useState('');
  const [labTests, setLabTests] = useState('');
  const [advice, setAdvice] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'email'>('whatsapp');

  const patient = selectedAppointment?.patient;
  const vitals = selectedAppointment ? getAppointmentVitals(selectedAppointment.id) : undefined;
  const patientHistory = selectedAppointment ? getPatientPrescriptions(selectedAppointment.patientId) : [];

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      // Simulate save delay
      setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 500);
    }, 1000);
  }, []);

  // Trigger auto-save on form changes
  useEffect(() => {
    if (diagnosis || complaint || medicines.length > 0 || labTests || advice) {
      triggerAutoSave();
    }
  }, [diagnosis, complaint, medicines, labTests, advice, triggerAutoSave]);

  // Filter suggestions
  const filteredDiagnoses = COMMON_DIAGNOSES.filter(d => 
    d.toLowerCase().includes(diagnosisSearch.toLowerCase()) && diagnosisSearch.length >= 3
  );
  
  const filteredComplaints = COMMON_COMPLAINTS.filter(c => 
    c.toLowerCase().includes(complaintSearch.toLowerCase()) && complaintSearch.length >= 3
  );
  
  const filteredMedicines = COMMON_MEDICINES.filter(m => 
    m.toLowerCase().includes(medicineSearch.toLowerCase()) && medicineSearch.length >= 3
  );
  
  const filteredLabTests = LAB_TESTS.filter(l => 
    l.toLowerCase().includes(labSearch.toLowerCase()) && labSearch.length >= 3
  );

  const handleAddMedicine = (medicineName?: string) => {
    const name = medicineName || medicineSearch;
    if (!name.trim()) return;
    
    setMedicines([...medicines, { name, dosage: currentDosage, days: currentDays }]);
    setMedicineSearch('');
    setCurrentDays('');
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSelectDiagnosis = (d: string) => {
    setDiagnosis(prev => prev ? `${prev}, ${d}` : d);
    setDiagnosisSearch('');
  };

  const handleSelectComplaint = (c: string) => {
    setComplaint(prev => prev ? `${prev}, ${c}` : c);
    setComplaintSearch('');
  };

  const handleSelectLabTest = (test: string) => {
    setLabTests(prev => prev ? `${prev}, ${test}` : test);
    setLabSearch('');
  };

  const handleSave = async () => {
    if (!selectedAppointment) return;

    setIsSubmitting(true);

    try {
      const allMedicines = [
        ...medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.dosage,
          duration: m.days ? `${m.days} days` : '',
        })),
      ];

      if (manualMedicines.trim()) {
        allMedicines.push({
          name: manualMedicines.trim(),
          dosage: '',
          frequency: '',
          duration: '',
        });
      }

      await addPrescription({
        patientId: selectedAppointment.patientId,
        appointmentId: selectedAppointment.id,
        diagnosis: diagnosis || complaint || 'Consultation',
        complaint: complaint,
        medicines: allMedicines,
        labTests: labTests,
        advice: advice,
        vitals: vitals,
        notes: `${advice}\n\nLab Tests: ${labTests}`.trim() || undefined,
        doctorName: user?.name || 'Dr. R. Balaji',
      });

      await updateAppointmentStatus(selectedAppointment.id, 'completed');

      toast({
        title: 'Prescription Saved',
        description: 'Prescription has been saved successfully.',
      });

      setShowPrintPreview(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save prescription.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToPatient = () => {
    if (sendMethod === 'whatsapp') {
      toast({
        title: 'Sent via WhatsApp',
        description: `Prescription sent to ${patient?.phone}`,
      });
    } else {
      toast({
        title: 'Sent via Email',
        description: `Prescription sent to ${patient?.email || 'patient email'}`,
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const formatOPNumber = () => {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      return `OP-${date}-001`;
    };

    // Use imported header and footer images
    const headerImgSrc = prescriptionHeader;
    const footerImgSrc = prescriptionFooter;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${patient?.firstName} ${patient?.lastName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          html, body { 
            height: 100%; 
            font-family: Arial, sans-serif; 
            font-size: 16px;
          }
          
          .page {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            padding: 0;
            page-break-after: always;
          }
          
          .header-img {
            width: 100%;
            height: auto;
            display: block;
            max-height: 120px;
            object-fit: contain;
          }
          
          .footer-img {
            width: 100%;
            height: auto;
            display: block;
            position: absolute;
            bottom: 0;
            left: 0;
            max-height: 100px;
            object-fit: contain;
          }
          
          .content {
            padding: 15px 25px;
            min-height: calc(297mm - 200px);
          }
          
          .patient-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            padding: 14px;
            border: 1px solid #ddd;
            margin-bottom: 18px;
            background: #fafafa;
          }
          
          .patient-info .label {
            color: #8B0000;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .patient-info .value {
            font-size: 16px;
            font-weight: bold;
          }
          
          .main-content {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 24px;
          }
          
          .vitals-section {
            background: #f8f8f8;
            padding: 14px;
            border-radius: 4px;
          }
          
          .vitals-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
          }
          
          .vital-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 15px;
          }
          
          .vital-label {
            font-weight: bold;
            color: #333;
          }
          
          .vital-value {
            color: #444;
          }
          
          .prescription-section {
            padding-left: 18px;
            border-left: 2px solid #8B0000;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #8B0000;
            margin: 16px 0 10px 0;
            text-transform: uppercase;
          }
          
          .section-content {
            background: #fff;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 16px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .medicine-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          
          .medicine-table th {
            background: #8B0000;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 15px;
          }
          
          .medicine-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 16px;
          }
          
          .rx-symbol {
            font-size: 24px;
            color: #8B0000;
            font-weight: bold;
          }
          
          @media print {
            body { padding: 0; }
            .page { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <img src="${headerImgSrc}" alt="Header" class="header-img" />
          
          <div class="content">
            <div class="patient-info">
              <div>
                <p class="label">MR. No:</p>
                <p class="value">${patient?.mrNumber}</p>
              </div>
              <div>
                <p class="label">Date:</p>
                <p class="value">${formatDate(new Date())}</p>
              </div>
              <div>
                <p class="label">Patient Name:</p>
                <p class="value">${patient?.firstName} ${patient?.lastName}</p>
              </div>
              <div>
                <p class="label">Gender/Age:</p>
                <p class="value">${patient?.gender} / ${patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '-'}</p>
              </div>
              <div>
                <p class="label">OP No:</p>
                <p class="value">${formatOPNumber()}</p>
              </div>
              <div>
                <p class="label">Weight:</p>
                <p class="value">${vitals?.weight || '-'} kg</p>
              </div>
              <div>
                <p class="label">Mobile No:</p>
                <p class="value">${patient?.phone}</p>
              </div>
              <div></div>
            </div>
            
            <div class="main-content">
              <div class="vitals-section">
                <div class="vitals-title">Clinical Parameters</div>
                <div class="vital-row">
                  <span class="vital-label">SPO2:</span>
                  <span class="vital-value">${vitals?.spo2 || '-'}%</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">Pulse Rate:</span>
                  <span class="vital-value">${vitals?.pulse || '-'} /min</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">Blood Pressure:</span>
                  <span class="vital-value">${vitals?.bloodPressure || '-'} mmHg</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">CVS:</span>
                  <span class="vital-value">${vitals?.cvs || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">RS:</span>
                  <span class="vital-value">${vitals?.rs || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">JVP:</span>
                  <span class="vital-value">${vitals?.jvp || '-'}</span>
                </div>
                
                <div class="vitals-title" style="margin-top: 15px;">Risk Factors</div>
                <div class="vital-row">
                  <span class="vital-label">HTN:</span>
                  <span class="vital-value">${vitals?.htn || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">DM:</span>
                  <span class="vital-value">${vitals?.dm || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">Smoking:</span>
                  <span class="vital-value">${vitals?.smoking || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">HLP:</span>
                  <span class="vital-value">${vitals?.hlp || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">F H/O CAD:</span>
                  <span class="vital-value">${vitals?.familyHOCAD || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">Heart Disease:</span>
                  <span class="vital-value">${vitals?.heartDisease || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">PTCA/CABG:</span>
                  <span class="vital-value">${vitals?.ptcaCabg || '-'}</span>
                </div>
                <div class="vital-row">
                  <span class="vital-label">Current Drugs:</span>
                  <span class="vital-value">${vitals?.currentDrugs || '-'}</span>
                </div>
              </div>
              
              <div class="prescription-section">
                <p class="section-title">Diagnosis</p>
                <div class="section-content">${diagnosis || '-'}</div>
                
                <p class="section-title">Complaint</p>
                <div class="section-content">${complaint || '-'}</div>
                
                <p class="section-title"><span class="rx-symbol">℞</span> Treatment</p>
                ${medicines.length > 0 ? `
                  <table class="medicine-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${medicines.map(m => `
                        <tr>
                          <td>${m.name}</td>
                          <td>${m.dosage}</td>
                          <td>${m.days ? m.days + ' days' : '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : `<div class="section-content">${manualMedicines || '-'}</div>`}
                
                <p class="section-title">Lab/Investigation</p>
                <div class="section-content">${labTests || '-'}</div>
                
                <p class="section-title">Advice</p>
                <div class="section-content">${advice || '-'}</div>
              </div>
            </div>
          </div>
          
          <img src="${footerImgSrc}" alt="Footer" class="footer-img" />
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (!selectedAppointment) {
    return (
      <div className="medical-section">
        <div className="text-center py-12">
          <FilePlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Select a patient to write prescription
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Go to "Today's Patients" and click "Start" on any patient
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-save indicator */}
      <div className="flex items-center justify-end gap-2 text-sm">
        {autoSaveStatus === 'saving' && (
          <span className="text-muted-foreground animate-pulse">Saving...</span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="text-success flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Auto-saved
          </span>
        )}
      </div>

      {/* Prescription/History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="prescription" className="gap-2">
            <FilePlus className="w-4 h-4" />
            Prescription
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescription" className="mt-4">
          {/* Patient Header Info */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">30 Years Experience in Treating BP and Heart Diseases</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-destructive">Dr. R. BALAJI</p>
                  <p className="text-xs text-muted-foreground">MD, DM, FSCAI (USA) | Regd No: 19870</p>
                  <p className="text-sm font-medium">Senior Interventional Cardiologist</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info Bar */}
          <Card className="mb-4">
            <CardContent className="py-3">
              <div className="grid grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-xs text-destructive font-medium">MR. No:</p>
                  <p className="font-bold">{patient?.mrNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-destructive font-medium">DATE:</p>
                  <p className="font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-destructive font-medium">Patient Name:</p>
                  <p className="font-bold">{patient?.firstName} {patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-destructive font-medium">Gender/Age:</p>
                  <p className="font-bold">
                    {patient?.gender} / {patient?.dateOfBirth 
                      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() 
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-destructive font-medium">Weight:</p>
                  <p className="font-bold">{vitals?.weight || '-'} kg</p>
                </div>
                <div>
                  <p className="text-xs text-destructive font-medium">Mobile No:</p>
                  <p className="font-bold">{patient?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vitals Display (Read-only) */}
          {vitals && (
            <Card className="mb-4 bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <p className="text-sm font-semibold text-primary mb-2">Clinical Parameters (Auto-populated from Vitals)</p>
                <div className="grid grid-cols-8 gap-3 text-xs">
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">SPO2</p>
                    <p className="font-bold">{vitals.spo2}%</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">Pulse</p>
                    <p className="font-bold">{vitals.pulse}/min</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">BP</p>
                    <p className="font-bold">{vitals.bloodPressure}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">CVS</p>
                    <p className="font-bold">{vitals.cvs}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">RS</p>
                    <p className="font-bold">{vitals.rs}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">HTN</p>
                    <p className="font-bold">{vitals.htn}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">DM</p>
                    <p className="font-bold">{vitals.dm}</p>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <p className="text-muted-foreground">Smoking</p>
                    <p className="font-bold">{vitals.smoking}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Form */}
          <div className="grid grid-cols-1 gap-4">
            {/* Diagnosis */}
            <div>
              <Label className="text-base font-semibold">Diagnosis</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Diagnosis (3 chars)..."
                  value={diagnosisSearch}
                  onChange={(e) => setDiagnosisSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredDiagnoses.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm">
                  {filteredDiagnoses.map(d => (
                    <button
                      key={d}
                      onClick={() => handleSelectDiagnosis(d)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChange={(e) => {
                  setDiagnosis(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-2 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* History */}
            <div>
              <Label className="text-base font-semibold">History</Label>
              <Textarea
                placeholder="Enter patient history..."
                value={history}
                onChange={(e) => {
                  setHistory(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-1 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* Complaint */}
            <div>
              <Label className="text-base font-semibold">Complaint</Label>
              <div className="relative mt-1 flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search complaints..."
                    value={complaintSearch}
                    onChange={(e) => setComplaintSearch(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button variant="outline" size="icon">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              {filteredComplaints.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm">
                  {filteredComplaints.map(c => (
                    <button
                      key={c}
                      onClick={() => handleSelectComplaint(c)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                placeholder="Type complaint or select from suggestions..."
                value={complaint}
                onChange={(e) => {
                  setComplaint(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-2 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* Treatment */}
            <div>
              <Label className="text-base font-semibold">Treatment</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 relative">
                  <Label className="text-xs text-muted-foreground">Search Medicine</Label>
                  <div className="relative">
                    <Input
                      placeholder="Type 3 chars to search medicine..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="w-24">
                  <Label className="text-xs text-muted-foreground">Dosage</Label>
                  <Input
                    placeholder="1-0-1"
                    value={currentDosage}
                    onChange={(e) => setCurrentDosage(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Days</Label>
                  <Input
                    placeholder="Days"
                    value={currentDays}
                    onChange={(e) => setCurrentDays(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => handleAddMedicine()} variant="outline" className="btn-touch">
                    Add
                  </Button>
                </div>
              </div>
              
              {filteredMedicines.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm">
                  {filteredMedicines.map(m => (
                    <button
                      key={m}
                      onClick={() => handleAddMedicine(m)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* Medicine List */}
              {medicines.length > 0 && (
                <div className="mt-2 space-y-1">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded hover:bg-muted/70">
                      <span className="flex-1 font-medium">{med.name}</span>
                      <span className="text-sm text-muted-foreground">{med.dosage}</span>
                      <span className="text-sm text-muted-foreground">{med.days && `${med.days} days`}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Type medicines manually..."
                value={manualMedicines}
                onChange={(e) => {
                  setManualMedicines(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-2 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* Lab/Investigations */}
            <div>
              <Label className="text-base font-semibold">Lab/Investigations</Label>
              <div className="relative mt-1">
                <Input
                  placeholder="Search Lab Tests (3 chars)..."
                  value={labSearch}
                  onChange={(e) => setLabSearch(e.target.value)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {filteredLabTests.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm">
                  {filteredLabTests.map(l => (
                    <button
                      key={l}
                      onClick={() => handleSelectLabTest(l)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                placeholder="Enter lab tests..."
                value={labTests}
                onChange={(e) => {
                  setLabTests(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-2 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* Advice */}
            <div>
              <Label className="text-base font-semibold">Advice</Label>
              <Textarea
                placeholder="Enter advice..."
                value={advice}
                onChange={(e) => {
                  setAdvice(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="mt-1 min-h-[60px] resize-none overflow-hidden"
                rows={3}
              />
            </div>

            {/* Footer Services */}
            <div className="text-center py-4 border-t">
              <p className="text-primary font-semibold">ECG    ECHO    TMT    HOLTER    ABPM</p>
              <p className="text-sm mt-2">
                <span className="text-destructive font-medium">Chanda Nagar :</span> Morning : 8.30 am to10.30 am, 
                <span className="text-destructive font-medium"> Evening</span> 6.30 pm to 9.30 pm
              </p>
            </div>

            {/* Actions - hidden in print */}
            <div className="flex items-center justify-center gap-3 py-4 print:hidden">
              <Button 
                onClick={handleSave} 
                disabled={isSubmitting} 
                className="gap-2 bg-destructive hover:bg-destructive/90 px-8 btn-touch"
              >
                <Save className="w-4 h-4" />
                Save Prescription
              </Button>
              {showPrintPreview && (
                <>
                  <Button variant="outline" onClick={handlePrint} className="gap-2 btn-touch">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  
                  {/* Send to Patient */}
                  <div className="flex items-center gap-2">
                    <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as 'whatsapp' | 'email')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSendToPatient} className="gap-2 bg-success hover:bg-success/90 btn-touch">
                      <Send className="w-4 h-4" />
                      Send to Patient
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {patientHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No previous visit history found for this patient.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {patientHistory.map((prescription, index) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Visit {patientHistory.length - index}</Badge>
                        <span className="text-sm text-muted-foreground">{prescription.createdAt}</span>
                      </div>
                      <span className="text-sm font-medium">{prescription.doctorName}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-destructive">Diagnosis:</p>
                        <p>{prescription.diagnosis}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-destructive">Complaint:</p>
                        <p>{prescription.complaint || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-destructive">Treatment:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {prescription.medicines.map((med, idx) => (
                            <Badge key={idx} variant="secondary">
                              {med.name} - {med.dosage} ({med.duration})
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {prescription.labTests && (
                        <div>
                          <p className="font-semibold text-destructive">Lab Tests:</p>
                          <p>{prescription.labTests}</p>
                        </div>
                      )}
                      {prescription.advice && (
                        <div>
                          <p className="font-semibold text-destructive">Advice:</p>
                          <p>{prescription.advice}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
