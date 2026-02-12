import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useClinicData, Appointment, PatientVitals } from '@/contexts/ClinicDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, User, Plus, Trash2, Save, Printer, Search, Clock, Mic, Send, Mail, MessageSquare, CheckCircle, FileText, ZoomIn, ZoomOut, X, Eye, ChevronDown, TestTube, Pill } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import prescriptionHeader from '@/assets/prescription-header.jpeg';
import prescriptionFooter from '@/assets/prescription-footer.jpeg';
import vitalsService from '@/services/vitalsService';
import documentService from '@/services/documentService';
import prescriptionService from '@/services/prescriptionService';
import type { Document as PatientDocument } from '@/services/documentService';

interface Medicine {
  name: string;
  dosage: string;
  days: string;
}

interface PrescriptionFormProps {
  selectedAppointment: Appointment | null;
  onComplete: () => void;
}

export interface PrescriptionFormRef {
  openDocuments: () => void;
}

interface DraftData {
  appointmentId: string;
  diagnosis: string;
  history: string;
  complaint: string;
  medicines: Medicine[];
  manualMedicines: string;
  labTests: string;
  advice: string;
  savedAt: string;
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

const DRAFT_STORAGE_KEY = 'prescription_draft_';

function getDraftKey(appointmentId: string) {
  return `${DRAFT_STORAGE_KEY}${appointmentId}`;
}

function loadDraft(appointmentId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(getDraftKey(appointmentId));
    if (!raw) return null;
    const draft: DraftData = JSON.parse(raw);
    if (draft.appointmentId !== appointmentId) return null;
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(appointmentId: string, data: Omit<DraftData, 'savedAt' | 'appointmentId'>) {
  try {
    const draft: DraftData = {
      ...data,
      appointmentId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(getDraftKey(appointmentId), JSON.stringify(draft));
  } catch {
    // localStorage full or unavailable
  }
}

function clearDraft(appointmentId: string) {
  try {
    localStorage.removeItem(getDraftKey(appointmentId));
  } catch {
    // ignore
  }
}

export const PrescriptionForm = forwardRef<PrescriptionFormRef, PrescriptionFormProps>(function PrescriptionForm({ selectedAppointment, onComplete }, ref) {
  const { addPrescription, updateAppointmentStatus, getAppointmentVitals, getPatientPrescriptions, addToLabQueue, addToPharmacyQueue } = useClinicData();
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTab, setActiveTab] = useState('prescription');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Vitals state - fetched from backend DB
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null);
  const [documentZoom, setDocumentZoom] = useState(100);

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
  const [isSending, setIsSending] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);

  const patient = selectedAppointment?.patient;
  const patientHistory = selectedAppointment ? getPatientPrescriptions(selectedAppointment.patientId) : [];

  // Expose openDocuments method to parent via ref
  useImperativeHandle(ref, () => ({
    openDocuments: () => setShowDocumentsDialog(true),
  }));

  // Fetch vitals from backend database when appointment is selected
  useEffect(() => {
    if (!selectedAppointment) return;

    const fetchVitals = async () => {
      setVitalsLoading(true);
      try {
        // First try from context (local state)
        const localVitals = getAppointmentVitals(selectedAppointment.id);
        if (localVitals) {
          setVitals(localVitals);
          setVitalsLoading(false);
          return;
        }

        // Fetch from backend API
        const apiVitals = await vitalsService.getByAppointment(selectedAppointment.id);
        if (apiVitals) {
          setVitals({
            id: apiVitals.id,
            appointmentId: apiVitals.appointment_id,
            patientId: apiVitals.patient_id,
            patientName: apiVitals.patient_name || '',
            mrNumber: apiVitals.patient_mr_number || '',
            spo2: apiVitals.spo2 || 0,
            pulse: apiVitals.pulse || 0,
            bloodPressure: apiVitals.blood_pressure || '',
            cvs: apiVitals.cvs || '',
            rs: apiVitals.rs || '',
            jvp: apiVitals.jvp || '',
            weight: apiVitals.weight || 0,
            hlp: apiVitals.hlp || '',
            htn: apiVitals.htn || '',
            dm: apiVitals.dm || '',
            smoking: apiVitals.smoking || '',
            familyHOCAD: apiVitals.family_ho_cad || '',
            heartDisease: apiVitals.heart_disease || '',
            ptcaCabg: apiVitals.ptca_cabg || '',
            currentDrugs: apiVitals.current_drugs || '',
            recordedAt: apiVitals.created_at,
            recordedBy: apiVitals.recorded_by || '',
          });
        }
      } catch {
        // Vitals may not exist yet for this appointment
        setVitals(null);
      } finally {
        setVitalsLoading(false);
      }
    };

    fetchVitals();
  }, [selectedAppointment, getAppointmentVitals]);

  // Fetch documents for the patient from backend
  useEffect(() => {
    if (!selectedAppointment) return;

    const fetchDocuments = async () => {
      setDocumentsLoading(true);
      try {
        const response = await documentService.getPatientDocuments(selectedAppointment.patientId);
        setDocuments(response.items || []);
      } catch {
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedAppointment]);

  // Load draft from localStorage when appointment is selected
  useEffect(() => {
    if (!selectedAppointment || draftLoaded) return;

    const draft = loadDraft(selectedAppointment.id);
    if (draft) {
      setDiagnosis(draft.diagnosis || '');
      setHistory(draft.history || 'NULL');
      setComplaint(draft.complaint || '');
      setMedicines(draft.medicines || []);
      setManualMedicines(draft.manualMedicines || '');
      setLabTests(draft.labTests || '');
      setAdvice(draft.advice || '');
      toast({
        title: 'Draft Restored',
        description: `Draft from ${new Date(draft.savedAt).toLocaleString()} has been restored.`,
      });
    }
    setDraftLoaded(true);
  }, [selectedAppointment, draftLoaded, toast]);

  // Auto-save draft to localStorage
  const triggerAutoSave = useCallback(() => {
    if (!selectedAppointment) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      saveDraft(selectedAppointment.id, {
        diagnosis,
        history,
        complaint,
        medicines,
        manualMedicines,
        labTests,
        advice,
      });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 1000);
  }, [selectedAppointment, diagnosis, history, complaint, medicines, manualMedicines, labTests, advice]);

  // Trigger auto-save on form changes
  useEffect(() => {
    if (diagnosis || complaint || medicines.length > 0 || labTests || advice) {
      triggerAutoSave();
    }
  }, [diagnosis, complaint, medicines, labTests, advice, triggerAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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

  const getDocumentFileUrl = (doc: PatientDocument) => {
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${baseUrl}/documents/${doc.id}/file?token=${token}`;
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

      const savedRx = await addPrescription({
        patientId: selectedAppointment.patientId,
        appointmentId: selectedAppointment.id,
        diagnosis: diagnosis || complaint || 'Consultation',
        complaint: complaint,
        history: history,
        medicines: allMedicines,
        labTests: labTests,
        advice: advice,
        vitals: vitals || undefined,
        notes: `${advice}\n\nLab Tests: ${labTests}`.trim() || undefined,
        doctorName: user?.name || 'Dr. R. Balaji',
      });

      await updateAppointmentStatus(selectedAppointment.id, 'completed');

      // Clear draft after successful save
      clearDraft(selectedAppointment.id);

      // Store the prescription ID for send-to-patient
      setSavedPrescriptionId(savedRx.id);

      // Generate and store PDF in backend folder (no download)
      try {
        await prescriptionService.generatePdf(savedRx.id);
        toast({
          title: 'Prescription Saved',
          description: 'Prescription saved and PDF generated successfully.',
        });
      } catch {
        toast({
          title: 'Prescription Saved',
          description: 'Prescription saved. PDF will be generated when sending to patient.',
        });
      }

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

  const handleSendToPatient = async (method: 'whatsapp' | 'email') => {
    if (method === 'whatsapp' && !patient?.phone) {
      toast({
        title: 'No Phone Number',
        description: 'Patient does not have a registered phone number.',
        variant: 'destructive',
      });
      return;
    }

    if (method === 'email' && !patient?.email) {
      toast({
        title: 'No Email Address',
        description: 'Patient does not have a registered email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!savedPrescriptionId) {
      toast({
        title: 'Error',
        description: 'Please save the prescription first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      if (method === 'whatsapp') {
        // Send via backend WhatsApp API
        await prescriptionService.sendWhatsApp(savedPrescriptionId, patient!.phone!);
        toast({
          title: 'WhatsApp Sent',
          description: `Prescription sent to ${patient!.firstName} via WhatsApp successfully.`,
        });
      } else {
        // Send via backend Email SMTP
        await prescriptionService.sendEmail(savedPrescriptionId, patient!.email!);
        toast({
          title: 'Email Sent',
          description: `Prescription sent to ${patient!.email} via email successfully.`,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : `Failed to send prescription via ${method}`;
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToLab = async (method: 'email' | 'whatsapp' | 'queue') => {
    if (!savedPrescriptionId) {
      toast({ title: 'Error', description: 'Please save the prescription first.', variant: 'destructive' });
      return;
    }

    if (!labTests.trim()) {
      toast({ title: 'No Lab Tests', description: 'No lab tests have been prescribed for this patient.', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      if (method === 'email') {
        await prescriptionService.sendToLabEmail(savedPrescriptionId);
        toast({ title: 'Email Sent to Lab', description: 'Prescription sent to lab via email.' });
      } else if (method === 'whatsapp') {
        await prescriptionService.sendToLabWhatsApp(savedPrescriptionId);
        toast({ title: 'WhatsApp Sent to Lab', description: 'Prescription sent to lab via WhatsApp.' });
      } else if (method === 'queue') {
        const labTestsList = labTests.split(',').map(t => t.trim()).filter(Boolean);
        await addToLabQueue({
          appointmentId: selectedAppointment!.id,
          patientId: selectedAppointment!.patientId,
          patientName: `${patient!.firstName} ${patient!.lastName}`,
          mrNumber: patient!.mrNumber,
          opNumber: selectedAppointment!.opNumber || `OP-${selectedAppointment!.tokenNumber}`,
          labTests: labTestsList,
          status: 'waiting',
        });
        toast({ title: 'Added to Lab Queue', description: `Patient added to lab queue with ${labTestsList.length} test(s).` });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : `Failed to send to lab via ${method}`;
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToPharmacy = async (method: 'email' | 'whatsapp' | 'queue') => {
    if (!savedPrescriptionId) {
      toast({ title: 'Error', description: 'Please save the prescription first.', variant: 'destructive' });
      return;
    }

    if (medicines.length === 0 && !manualMedicines.trim()) {
      toast({ title: 'No Medicines', description: 'No medicines have been prescribed for this patient.', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      if (method === 'email') {
        await prescriptionService.sendToPharmacyEmail(savedPrescriptionId);
        toast({ title: 'Email Sent to Pharmacy', description: 'Prescription sent to pharmacy via email.' });
      } else if (method === 'whatsapp') {
        await prescriptionService.sendToPharmacyWhatsApp(savedPrescriptionId);
        toast({ title: 'WhatsApp Sent to Pharmacy', description: 'Prescription sent to pharmacy via WhatsApp.' });
      } else if (method === 'queue') {
        const medicineNames = medicines.map(m => m.name);
        if (manualMedicines.trim()) {
          medicineNames.push(manualMedicines.trim());
        }
        await addToPharmacyQueue({
          appointmentId: selectedAppointment!.id,
          patientId: selectedAppointment!.patientId,
          patientName: `${patient!.firstName} ${patient!.lastName}`,
          mrNumber: patient!.mrNumber,
          opNumber: selectedAppointment!.opNumber || `OP-${selectedAppointment!.tokenNumber}`,
          medicines: medicineNames,
          status: 'waiting',
        });
        toast({ title: 'Added to Pharmacy Queue', description: `Patient added to pharmacy queue with ${medicineNames.length} medicine(s).` });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : `Failed to send to pharmacy via ${method}`;
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const formatOPNumber = () => {
    if (selectedAppointment?.opNumber) {
      return selectedAppointment.opNumber;
    }
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const token = String(selectedAppointment?.tokenNumber || 1).padStart(3, '0');
    return `OP-${date}-${token}`;
  };

  const getPDFFileName = () => {
    const opNumber = formatOPNumber();
    return `${opNumber}.pdf`;
  };

  const buildPrescriptionHTML = () => {
    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const headerImgSrc = prescriptionHeader;
    const footerImgSrc = prescriptionFooter;
    const pdfFileName = getPDFFileName();

    // Build treatment text
    let treatmentText = '';
    if (medicines.length > 0) {
      treatmentText = medicines.map(m => {
        let line = m.name;
        if (m.dosage) line += ` (${m.dosage})`;
        if (m.days) line += ` - ${m.days} days`;
        return line;
      }).join('\n');
    }
    if (manualMedicines.trim()) {
      treatmentText += (treatmentText ? '\n' : '') + manualMedicines.trim();
    }

    return `<!DOCTYPE html>
<html>
<head>
  <title>${pdfFileName} - ${patient?.firstName} ${patient?.lastName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #222;
      background: #fff;
    }

    /* === Page structure with repeating header/footer === */
    table.page-table {
      width: 100%;
      border-collapse: collapse;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tbody { display: table-row-group; }

    .header-cell { padding: 0; }
    .footer-cell { padding: 0; }
    .body-cell { padding: 20px 30px 10px 30px; vertical-align: top; }

    .header-img {
      width: 100%;
      display: block;
    }
    .footer-img {
      width: 100%;
      display: block;
    }

    /* === Patient Info Table === */
    .patient-info-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #bbb;
      margin-bottom: 20px;
    }
    .patient-info-table td {
      padding: 8px 12px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    .pi-label {
      color: #8B0000;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .pi-value {
      font-size: 14px;
      font-weight: bold;
      display: block;
    }

    /* === Two Column Layout === */
    .two-col-table {
      width: 100%;
      border-collapse: collapse;
    }
    .two-col-table td {
      vertical-align: top;
      padding: 0;
    }
    .col-vitals {
      width: 220px;
      padding-right: 20px;
    }
    .col-prescription {
      padding-left: 20px;
      border-left: 1px solid #ddd;
    }

    /* === Vitals List === */
    .vitals-list {
      width: 100%;
      border-collapse: collapse;
    }
    .vitals-list td {
      padding: 4px 0;
      vertical-align: top;
      font-size: 13px;
    }
    .vl-label {
      font-weight: bold;
      color: #333;
      white-space: nowrap;
      padding-right: 12px;
      width: 120px;
    }
    .vl-value {
      color: #444;
    }

    /* === Prescription Sections === */
    .rx-section-title {
      font-size: 13px;
      font-weight: bold;
      color: #333;
      margin-top: 12px;
      margin-bottom: 4px;
    }
    .rx-section-title:first-child {
      margin-top: 0;
    }
    .rx-section-content {
      font-size: 13px;
      color: #444;
      line-height: 1.5;
      margin-bottom: 8px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <table class="page-table">
    <thead>
      <tr><td class="header-cell">
        <img src="${headerImgSrc}" alt="Header" class="header-img" />
      </td></tr>
    </thead>
    <tfoot>
      <tr><td class="footer-cell">
        <img src="${footerImgSrc}" alt="Footer" class="footer-img" />
      </td></tr>
    </tfoot>
    <tbody>
      <tr><td class="body-cell">

        <!-- Patient Info -->
        <table class="patient-info-table">
          <tr>
            <td>
              <span class="pi-label">MR. No:</span>
              <span class="pi-value">${patient?.mrNumber || '-'}</span>
            </td>
            <td>
              <span class="pi-label">DATE:</span>
              <span class="pi-value">${formatDate(new Date())}</span>
            </td>
            <td>
              <span class="pi-label">Patient Name:</span>
              <span class="pi-value">${patient?.firstName || ''} ${patient?.lastName || ''}</span>
            </td>
            <td>
              <span class="pi-label">Gender/Age:</span>
              <span class="pi-value">${patient?.gender || '-'} / ${patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '-'}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span class="pi-label">OP No:</span>
              <span class="pi-value">${formatOPNumber()}</span>
            </td>
            <td>
              <span class="pi-label">Weight:</span>
              <span class="pi-value">${vitals?.weight ? vitals.weight + " Kg's" : '-'}</span>
            </td>
            <td>
              <span class="pi-label">Mobile No:</span>
              <span class="pi-value">${patient?.phone || '-'}</span>
            </td>
            <td></td>
          </tr>
        </table>

        <!-- Two Column: Vitals Left | Prescription Right -->
        <table class="two-col-table">
          <tr>
            <!-- LEFT: Vitals -->
            <td class="col-vitals">
              <table class="vitals-list">
                <tr>
                  <td class="vl-label">SPO2:</td>
                  <td class="vl-value">${vitals?.spo2 ? vitals.spo2 + ' %' : '%'}</td>
                </tr>
                <tr>
                  <td class="vl-label">PR:</td>
                  <td class="vl-value">${vitals?.pulse ? vitals.pulse + ' mm/mt' : 'mm/mt'}</td>
                </tr>
                <tr>
                  <td class="vl-label">CVS:</td>
                  <td class="vl-value">${vitals?.cvs || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">RS:</td>
                  <td class="vl-value">${vitals?.rs || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">JVP:</td>
                  <td class="vl-value">${vitals?.jvp || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">BP:</td>
                  <td class="vl-value">${vitals?.bloodPressure || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">HTN:</td>
                  <td class="vl-value">${vitals?.htn || '-'}</td>
                </tr>
                <tr>
                  <td class="vl-label">DM:</td>
                  <td class="vl-value">${vitals?.dm || '-'}</td>
                </tr>
                <tr>
                  <td class="vl-label">SMOKING:</td>
                  <td class="vl-value">${vitals?.smoking || '-'}</td>
                </tr>
                <tr>
                  <td class="vl-label">THYROID:</td>
                  <td class="vl-value"></td>
                </tr>
                <tr>
                  <td class="vl-label">HLP:</td>
                  <td class="vl-value">${vitals?.hlp || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">F H/O CAD:</td>
                  <td class="vl-value">${vitals?.familyHOCAD || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">HEART DISEASE:</td>
                  <td class="vl-value">${vitals?.heartDisease || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">PTCA/CABG:</td>
                  <td class="vl-value">${vitals?.ptcaCabg || ''}</td>
                </tr>
                <tr>
                  <td class="vl-label">DRUGS:</td>
                  <td class="vl-value">${vitals?.currentDrugs || ''}</td>
                </tr>
              </table>
            </td>

            <!-- RIGHT: Prescription -->
            <td class="col-prescription">
              <div class="rx-section-title">Complaint:</div>
              <div class="rx-section-content">${complaint || '-'}</div>

              <div class="rx-section-title">History:</div>
              <div class="rx-section-content">${history && history !== 'NULL' ? history : '-'}</div>

              <div class="rx-section-title">Treatment:</div>
              <div class="rx-section-content">${treatmentText || '-'}</div>

              <div class="rx-section-title">Diagnosis:</div>
              <div class="rx-section-content">${diagnosis || '-'}</div>

              <div class="rx-section-title">Advice:</div>
              <div class="rx-section-content">${advice || '-'}</div>

              <div class="rx-section-title">Lab/Investigation:</div>
              <div class="rx-section-content">${labTests || '-'}</div>
            </td>
          </tr>
        </table>

      </td></tr>
    </tbody>
  </table>
</body>
</html>`;
  };

  const generatePDF = async (): Promise<Blob> => {
    const html = buildPrescriptionHTML();
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    const pdfBlob: Blob = await html2pdf()
      .set({
        margin: 0,
        filename: getPDFFileName(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .outputPdf('blob');

    document.body.removeChild(container);
    return pdfBlob;
  };

  const downloadPDF = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getPDFFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = buildPrescriptionHTML();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = getPDFFileName();
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
          <span className="text-muted-foreground animate-pulse">Saving draft...</span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="text-success flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Draft auto-saved
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

          {/* Vitals Display (Read-only from Database) */}
          <Card className="mb-4 bg-primary/5 border-primary/20">
            <CardContent className="py-3">
              <p className="text-sm font-semibold text-primary mb-2">
                Clinical Parameters (From Database)
                {vitalsLoading && <span className="ml-2 text-muted-foreground animate-pulse">Loading...</span>}
              </p>
              {vitals ? (
                <>
                  <div className="grid grid-cols-7 gap-3 text-xs mb-3">
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">SPO2:</p>
                      <p className="font-bold">{vitals.spo2 || '-'} %</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">PR:</p>
                      <p className="font-bold">{vitals.pulse || '-'} mm/mt</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">CVS:</p>
                      <p className="font-bold">{vitals.cvs || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">RS:</p>
                      <p className="font-bold">{vitals.rs || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">JVP:</p>
                      <p className="font-bold">{vitals.jvp || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">BP:</p>
                      <p className="font-bold">{vitals.bloodPressure || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">Weight:</p>
                      <p className="font-bold">{vitals.weight || '-'}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-primary mb-2">Risk Factors</p>
                  <div className="grid grid-cols-7 gap-3 text-xs">
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">HTN:</p>
                      <p className="font-bold">{vitals.htn || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">DM:</p>
                      <p className="font-bold">{vitals.dm || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">SMOKING:</p>
                      <p className="font-bold">{vitals.smoking || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">HLP:</p>
                      <p className="font-bold">{vitals.hlp || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">F H/O CAD:</p>
                      <p className="font-bold">{vitals.familyHOCAD || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">HEART DISEASE:</p>
                      <p className="font-bold">{vitals.heartDisease || '-'}</p>
                    </div>
                    <div className="bg-background p-2 rounded border">
                      <p className="text-muted-foreground font-bold">PTCA/CABG:</p>
                      <p className="font-bold">{vitals.ptcaCabg || '-'}</p>
                    </div>
                  </div>
                  {vitals.currentDrugs && (
                    <div className="mt-2 bg-background p-2 rounded border text-xs">
                      <p className="text-muted-foreground font-bold">DRUGS:</p>
                      <p className="font-bold">{vitals.currentDrugs}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-muted-foreground py-2">
                  {vitalsLoading ? 'Fetching vitals from database...' : 'No vitals recorded for this appointment.'}
                </div>
              )}
            </CardContent>
          </Card>

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
            <div className="flex items-center justify-center gap-3 py-4 print:hidden flex-wrap">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="gap-2 bg-destructive hover:bg-destructive/90 px-8 btn-touch"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Prescription'}
              </Button>
              {showPrintPreview && (
                <>
                  <Button variant="outline" onClick={handlePrint} className="gap-2 btn-touch">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>

                  {/* Send to Patient Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-2 bg-success hover:bg-success/90 btn-touch" disabled={isSending}>
                        <Send className="w-4 h-4" />
                        {isSending ? 'Sending...' : 'Send to Patient'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSendToPatient('whatsapp')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToPatient('email')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <Mail className="w-4 h-4" />
                        Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Send to Lab Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white btn-touch" disabled={isSending || !labTests.trim()}>
                        <TestTube className="w-4 h-4" />
                        {isSending ? 'Sending...' : 'Send to Lab'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSendToLab('email')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <Mail className="w-4 h-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToLab('whatsapp')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToLab('queue')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <Plus className="w-4 h-4" />
                        Add to Queue
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Send to Pharmacy Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white btn-touch" disabled={isSending || (medicines.length === 0 && !manualMedicines.trim())}>
                        <Pill className="w-4 h-4" />
                        {isSending ? 'Sending...' : 'Send to Pharmacy'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSendToPharmacy('email')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <Mail className="w-4 h-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToPharmacy('whatsapp')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToPharmacy('queue')} className="gap-2 cursor-pointer" disabled={isSending}>
                        <Plus className="w-4 h-4" />
                        Add to Queue
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Documents Viewer Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Patient Documents - {patient?.firstName} {patient?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedDocument ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Document viewer toolbar */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocument(null)}
                    className="gap-1"
                  >
                    <X className="w-4 h-4" />
                    Back to list
                  </Button>
                  <span className="text-sm font-medium">{selectedDocument.file_name}</span>
                  <Badge variant="secondary">{selectedDocument.document_type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentZoom(Math.max(25, documentZoom - 25))}
                    disabled={documentZoom <= 25}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[50px] text-center">{documentZoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentZoom(Math.min(300, documentZoom + 25))}
                    disabled={documentZoom >= 300}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentZoom(100)}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Document viewer */}
              <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
                {selectedDocument.file_type?.startsWith('image/') ? (
                  <img
                    src={getDocumentFileUrl(selectedDocument)}
                    alt={selectedDocument.file_name}
                    style={{
                      transform: `scale(${documentZoom / 100})`,
                      transformOrigin: 'top center',
                      maxWidth: 'none',
                      transition: 'transform 0.2s ease',
                    }}
                    className="shadow-lg rounded"
                  />
                ) : selectedDocument.file_type === 'application/pdf' ? (
                  <iframe
                    src={getDocumentFileUrl(selectedDocument)}
                    title={selectedDocument.file_name}
                    style={{
                      width: `${documentZoom}%`,
                      height: '100%',
                      minHeight: '500px',
                      border: 'none',
                      transition: 'width 0.2s ease',
                    }}
                    className="bg-white shadow-lg rounded"
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Preview not available for this file type.</p>
                    <a
                      href={getDocumentFileUrl(selectedDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline mt-2 inline-block"
                    >
                      Download to view
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {documentsLoading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded for this patient.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                  {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/40"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setDocumentZoom(100);
                      }}
                    >
                      <CardContent className="p-3">
                        {/* Thumbnail */}
                        <div className="h-32 bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
                          {doc.file_type?.startsWith('image/') ? (
                            <img
                              src={getDocumentFileUrl(doc)}
                              alt={doc.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate" title={doc.file_name}>
                            {doc.file_name}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {doc.document_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {doc.file_size_formatted || `${Math.round(doc.file_size / 1024)} KB`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setDocumentZoom(100);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
