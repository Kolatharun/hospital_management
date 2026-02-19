import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useClinicData, Appointment, PatientVitals, Prescription } from '@/contexts/ClinicDataContext';
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
import { FilePlus, User, Plus, Trash2, Save, Printer, Search, Clock, Mic, Send, Mail, MessageSquare, CheckCircle, FileText, ZoomIn, ZoomOut, X, Eye, ChevronDown, TestTube, Pill, Phone as PhoneIcon, Globe } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import prescriptionHeader from '@/assets/prescription-header.jpeg';
import prescriptionFooter from '@/assets/prescription-footer.jpeg';
import logo from '@/assets/logo.jpeg';
import vitalsService from '@/services/vitalsService';
import documentService from '@/services/documentService';
import prescriptionService from '@/services/prescriptionService';
import masterDataService, { Complaint, Diagnosis, LabTest } from '@/services/masterDataService';
import doctorService, { DoctorProfile } from '@/services/doctorService';
import type { Document as PatientDocument } from '@/services/documentService';
import { DocumentViewer } from './DocumentViewer';

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

function calculateAge(dob: string | undefined): string {
  if (!dob) return '-';
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : '-';
  } catch {
    return '-';
  }
}

export const PrescriptionForm = forwardRef<PrescriptionFormRef, PrescriptionFormProps>(function PrescriptionForm({ selectedAppointment, onComplete }, ref) {
  const { addPrescription, updateAppointmentStatus, getAppointmentVitals, addToLabQueue, addToPharmacyQueue } = useClinicData();
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for auto-resizing textareas
  const diagnosisTextareaRef = useRef<HTMLTextAreaElement>(null);
  const complaintTextareaRef = useRef<HTMLTextAreaElement>(null);
  const treatmentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const labTextareaRef = useRef<HTMLTextAreaElement>(null);
  const adviceTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState('prescription');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Vitals state - fetched from backend DB with fallback support
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [isOldVitals, setIsOldVitals] = useState(false);
  const [sourceOpNumber, setSourceOpNumber] = useState<string | null>(null);
  const [vitalsVisitDate, setVitalsVisitDate] = useState<string | null>(null);
  const [hasVitals, setHasVitals] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Form states
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<Diagnosis[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [history, setHistory] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintSuggestions, setComplaintSuggestions] = useState<Complaint[]>([]);
  const [complaint, setComplaint] = useState('');

  const [medicineSearch, setMedicineSearch] = useState('');
  const [currentDosage, setCurrentDosage] = useState('1-0-1');
  const [currentDays, setCurrentDays] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [manualMedicines, setManualMedicines] = useState('');

  const [labSearch, setLabSearch] = useState('');
  const [labSuggestions, setLabSuggestions] = useState<LabTest[]>([]);
  const [labTests, setLabTests] = useState('');
  const [advice, setAdvice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);

  // Patient history state - fetched from API (all previous visits)
  const [patientHistory, setPatientHistory] = useState<Prescription[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Doctor profile state - fetched from backend based on logged-in doctor
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  const patient = selectedAppointment?.patient;

  // Expose openDocuments method to parent via ref
  useImperativeHandle(ref, () => ({
    openDocuments: () => setShowDocumentsDialog(true),
  }));

  // Fetch logged-in doctor's profile from backend
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const profile = await doctorService.getMyProfile();
        setDoctorProfile(profile);
      } catch {
        // Fallback handled in UI - will show placeholder if profile not available
      }
    };

    if (user?.role === 'doctor') {
      fetchDoctorProfile();
    }
  }, [user]);

  // Fetch vitals from backend database when appointment is selected (with fallback support)
  useEffect(() => {
    if (!selectedAppointment) return;

    const fetchVitals = async () => {
      setVitalsLoading(true);
      // Reset fallback state
      setIsOldVitals(false);
      setSourceOpNumber(null);
      setVitalsVisitDate(null);
      setHasVitals(false);

      try {
        // First try from context (local state) for current appointment only
        const localVitals = getAppointmentVitals(selectedAppointment.id);
        if (localVitals) {
          setVitals(localVitals);
          setIsOldVitals(false);
          setHasVitals(true);
          setVitalsLoading(false);
          return;
        }

        // Fetch from backend API with fallback support
        const response = await vitalsService.getByAppointmentWithFallback(selectedAppointment.id);

        if (response.has_vitals && response.vitals) {
          const apiVitals = response.vitals;
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
          setIsOldVitals(response.is_old_vitals);
          setSourceOpNumber(response.source_op_number);
          setVitalsVisitDate(response.visit_date);
          setHasVitals(true);
        } else {
          // No vitals found at all for this patient
          setVitals(null);
          setHasVitals(false);
        }
      } catch {
        // API error - no vitals available
        setVitals(null);
        setHasVitals(false);
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

  // Fetch patient prescription history from backend API (all past visits, excluding current)
  useEffect(() => {
    if (!selectedAppointment) {
      setPatientHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        // Fetch all prescriptions for this patient (by patient_id/MR number), excluding current appointment
        const historyData = await prescriptionService.getPatientPrescriptions(
          selectedAppointment.patientId,
          0,
          50,
          selectedAppointment.id // Exclude current appointment
        );

        // Map API response to local Prescription format
        const mappedHistory: Prescription[] = historyData.map(rx => ({
          id: rx.id,
          patientId: rx.patient_id,
          appointmentId: rx.appointment_id,
          diagnosis: rx.diagnosis,
          complaint: rx.complaint || undefined,
          history: rx.history || undefined,
          medicines: rx.medicines.map(m => ({
            name: m.medicine_name,
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            duration: m.duration || '',
          })),
          labTests: rx.lab_tests || undefined,
          advice: rx.advice || undefined,
          notes: rx.notes || undefined,
          createdAt: rx.created_at,
          doctorName: rx.doctor_name || '',
          sentToPatient: rx.sent_to_patient,
          sentVia: rx.sent_via as 'whatsapp' | 'email' | undefined,
        }));

        setPatientHistory(mappedHistory);

        // Populate history field from previous complaints
        if (mappedHistory.length > 0) {
          const previousComplaints = mappedHistory
            .filter(rx => rx.complaint && rx.complaint.trim())
            .map(rx => rx.complaint!.trim())
            .join('; ');
          setHistory(previousComplaints || 'NA');
        } else {
          setHistory('NA');
        }
      } catch {
        setPatientHistory([]);
        setHistory('NA');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [selectedAppointment]);

  // Load draft from localStorage when appointment is selected
  useEffect(() => {
    if (!selectedAppointment || draftLoaded) return;

    const draft = loadDraft(selectedAppointment.id);
    if (draft) {
      setDiagnosis(draft.diagnosis || '');
      // History is populated from API - don't override from draft
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

  // Fetch suggestions from backend
  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (diagnosisSearch.length >= 1) {
        try {
          const results = await masterDataService.searchDiagnosis(diagnosisSearch);
          setDiagnosisSuggestions(results);
        } catch (error) {
          console.error('Failed to fetch diagnosis suggestions', error);
        }
      } else {
        setDiagnosisSuggestions([]);
      }
    };

    const timer = setTimeout(fetchDiagnosis, 300);
    return () => clearTimeout(timer);
  }, [diagnosisSearch]);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (complaintSearch.length >= 1) {
        try {
          const results = await masterDataService.searchComplaints(complaintSearch);
          setComplaintSuggestions(results);
        } catch (error) {
          console.error('Failed to fetch complaint suggestions', error);
        }
      } else {
        setComplaintSuggestions([]);
      }
    };

    const timer = setTimeout(fetchComplaints, 300);
    return () => clearTimeout(timer);
  }, [complaintSearch]);

  useEffect(() => {
    const fetchLabTests = async () => {
      if (labSearch.length >= 1) {
        try {
          const results = await masterDataService.searchLabTests(labSearch);
          setLabSuggestions(results);
        } catch (error) {
          console.error('Failed to fetch lab suggestions', error);
        }
      } else {
        setLabSuggestions([]);
      }
    };

    const timer = setTimeout(fetchLabTests, 300);
    return () => clearTimeout(timer);
  }, [labSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-resize textareas when their values change (e.g., from dropdown selection)
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea(diagnosisTextareaRef.current);
  }, [diagnosis, autoResizeTextarea]);

  useEffect(() => {
    autoResizeTextarea(complaintTextareaRef.current);
  }, [complaint, autoResizeTextarea]);

  useEffect(() => {
    autoResizeTextarea(treatmentTextareaRef.current);
  }, [manualMedicines, autoResizeTextarea]);

  useEffect(() => {
    autoResizeTextarea(labTextareaRef.current);
  }, [labTests, autoResizeTextarea]);

  useEffect(() => {
    autoResizeTextarea(adviceTextareaRef.current);
  }, [advice, autoResizeTextarea]);

  const filteredMedicines = COMMON_MEDICINES.filter(m =>
    m.toLowerCase().includes(medicineSearch.toLowerCase()) && medicineSearch.length >= 3
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
    setDiagnosis(prev => prev.trim() ? `${prev.trim()}\n${d}` : d);
    setDiagnosisSearch('');
  };

  const handleSelectComplaint = (c: string) => {
    setComplaint(prev => prev.trim() ? `${prev.trim()}\n${c}` : c);
    setComplaintSearch('');
  };

  const handleSelectLabTest = (test: string) => {
    setLabTests(prev => prev.trim() ? `${prev.trim()}\n${test}` : test);
    setLabSearch('');
  };

  const handleSelectMedicine = (medicineName: string) => {
    setMedicineSearch(medicineName);
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
        doctorName: doctorProfile?.name || user?.name || 'Doctor',
      });

      await updateAppointmentStatus(selectedAppointment.id, 'completed');

      // Clear draft after successful save
      clearDraft(selectedAppointment.id);

      // Store the prescription ID for send-to-patient
      setSavedPrescriptionId(savedRx.id);

      // Generate and store PDF in backend folder immediately (synchronous)
      try {
        await prescriptionService.generatePdf(savedRx.id);
        toast({
          title: 'Prescription Saved',
          description: 'Prescription saved and PDF generated successfully.',
        });
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        toast({
          title: 'Prescription Saved',
          description: 'Prescription saved but PDF generation failed. Please try printing manually.',
          variant: 'destructive',
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
      if (!d) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const pdfFileName = getPDFFileName();

    let treatmentText = medicines.map(m => {
      let line = m.name;
      if (m.dosage) line += ` (${m.dosage})`;
      if (m.days) line += ` - ${m.days} days`;
      return line;
    }).join('\n');
    if (manualMedicines.trim()) {
      treatmentText += (treatmentText ? '\n' : '') + manualMedicines.trim();
    }

    const logoSrc = logo;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pdfFileName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #222;
      background: #fff;
      line-height: 1.4;
    }

    /* Repeating Header/Footer structure */
    table.print-container {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tbody { display: table-row-group; }

    .header-cell { padding: 30px 45px 5px 45px; }
    .footer-cell { padding: 5px 45px 30px 45px; }
    .body-cell { padding: 10px 45px; vertical-align: top; }

    /* Clinic Header */
    .tagline { text-align: center; color: #8B0000; font-size: 11px; margin-bottom: 12px; font-weight: 500; font-style: italic; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    .dr-info { flex: 1; }
    .dr-name { color: #222; font-size: 22px; font-weight: 700; margin-bottom: 2px; }
    .dr-degree { color: #666; font-size: 13px; margin-bottom: 8px; }
    .dr-title { color: #222; font-size: 15px; font-weight: 700; margin-bottom: 2px; }
    .dr-hospital { color: #666; font-size: 13px; margin-bottom: 10px; }
    .dr-contact-item { font-size: 11px; color: #444; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }
    .logo-container { width: 170px; text-align: right; }
    .logo-img { width: 100%; max-height: 90px; object-fit: contain; }
    .maroon-line { border-bottom: 3.5px solid #8B0000; margin-top: 12px; }

    /* Patient Info Box */
    .patient-box {
      border: 1.5px solid #d1d5db;
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 25px;
      margin-bottom: 25px;
    }
    .p-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr 1fr; gap: 12px 20px; }
    .p-item { display: flex; flex-direction: column; }
    .p-label { color: #8B0000; font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
    .p-value { font-size: 14px; font-weight: 700; color: #000; }

    /* Layout for Vitals & Rx */
    .main-layout { display: flex; min-height: 600px; }
    .sidebar { width: 215px; border-right: 1.5px solid #e5e7eb; padding-right: 20px; flex-shrink: 0; }
    .content { flex: 1; padding-left: 25px; }

    .v-row { display: flex; justify-content: space-between; padding: 4.5px 0; align-items: baseline; }
    .v-label { color: #000; font-weight: 700; font-size: 13px; width: 110px; }
    .v-value { color: #333; font-size: 13px; font-weight: 500; flex: 1; text-align: left; }

    .rx-sec { margin-bottom: 22px; }
    .rx-sec-title { color: #000; font-weight: 700; font-size: 14px; margin-bottom: 5px; }
    .rx-sec-val { color: #333; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }

    /* Fixed Footer placement */
    .footer-wrapper {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 190px;
      padding: 5px 45px 30px 45px;
      background: white;
      z-index: 1000;
    }

    .tfoot-spacer {
      height: 190px;
    }

    /* Footer Details Refinement */
    .footer-divider { border-top: 1px solid #e5e7eb; margin-bottom: 12px; }
    .services-row { color: #8B0000; font-weight: 500; font-size: 14px; text-align: center; margin-bottom: 8px; font-family: 'Arial', sans-serif; letter-spacing: 1px; word-spacing: 20px; }
    .timings-row { text-align: center; font-size: 13px; margin-bottom: 8px; color: #333; }
    .timings-row b { color: #8B0000; font-weight: 700; }
    
    .medicover-line { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
    .outline-heart { color: #8B0000; font-size: 18px; margin-right: 2px; }
    .medicover-text { color: #022b4d; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; }
    .hospital-text { color: #888; font-weight: 500; font-size: 13px; text-transform: uppercase; }
    .location-text { color: #888; font-weight: 500; font-size: 13px; }

    .address-box { font-size: 11.5px; color: #777; text-align: center; max-width: 700px; margin: 0 auto 10px; line-height: 1.4; }
    .appointment-call { text-align: center; font-weight: 700; font-size: 13px; color: #000; }

    /* Print Tweaks */
    @media print {
      body { -webkit-print-color-adjust: exact; }
      .v-row, .rx-sec, .p-item { break-inside: avoid; }
      .footer-wrapper { position: fixed; bottom: 0; }
    }
  </style>
</head>
<body>
  <div class="footer-wrapper">
    <div class="footer-divider"></div>
    <div class="services-row">ECG &nbsp; ECHO &nbsp; TMT &nbsp; HOLTER &nbsp; ABPM</div>
    <div class="timings-row">
      <b>Chanda Nagar :</b> Morning : 8.30 am to 10.30 am, <b>Evening</b> 6.30 pm to 9.30 pm
    </div>
    <div class="medicover-line">
       <span class="outline-heart">&#9825;</span>
       <span class="medicover-text">MEDICOVER</span>
       <span class="hospital-text">HOSPITALS</span>
       <span class="location-text">Hitech City</span>
    </div>
    <div class="address-box">
      SVL Towers, Ground Floor, Opp. Anu Furniture, Beside Narayana Junior Collage, Chanda Nagar<br/>
      Hyderabad - 500 050, Telangana Email: balajiheartcenter.hyd@gmail.com
    </div>
    <div class="appointment-call">For Appointment: +91 9100079990 / 9010278278 / 040-2303 2345</div>
  </div>

  <table class="print-container">
    <thead>
      <tr><td class="header-cell">
        <div class="tagline">30 Years Experience in Treating BP and Heart Diseases</div>
        <div class="header-content">
          <div class="dr-info">
            <div class="dr-name">${doctorProfile?.name || user?.name || 'Doctor'}</div>
            <div class="dr-degree">${doctorProfile?.qualification || ''}${doctorProfile?.registration_number ? ` | Regd No: ${doctorProfile.registration_number}` : ''}</div>
            <div class="dr-title">${doctorProfile?.speciality || ''}</div>
            <div class="dr-hospital">Medicover Hospitals - Hitech City</div>
            <div class="dr-contact-item"><span>&#9990;</span> ${doctorProfile?.phone || ''}</div>
            <div class="dr-contact-item"><span>&#127760;</span> www.balajiheartcenter.com</div>
            <div class="dr-contact-item"><span>&#128100;</span> www.facebook.com/balajiheartcenter</div>
          </div>
          <div class="logo-container">
            <img src="${logoSrc}" class="logo-img" alt="Clinic Logo" />
          </div>
        </div>
        <div class="maroon-line"></div>
      </td></tr>
    </thead>
    <tfoot>
      <tr><td class="tfoot-spacer"></td></tr>
    </tfoot>
    <tbody>
      <tr><td class="body-cell">
        
        <!-- Patient Profile Box -->
        <div class="patient-box">
          <div class="p-grid">
            <div class="p-item">
              <span class="p-label">MR. No:</span>
              <span class="p-value">${patient?.mrNumber || '-'}</span>
            </div>
            <div class="p-item">
              <span class="p-label">DATE:</span>
              <span class="p-value">${formatDate(new Date())}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Patient Name:</span>
              <span class="p-value">${patient?.firstName || ''} ${patient?.lastName || ''}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Gender/Age:</span>
              <span class="p-value">${patient?.gender || '-'} / ${calculateAge(patient?.dateOfBirth)}</span>
            </div>
            <div class="p-item">
              <span class="p-label">OP No:</span>
              <span class="p-value">${formatOPNumber()}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Weight:</span>
              <span class="p-value">${vitals?.weight ? vitals.weight + " Kg's" : '-'}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Mobile No:</span>
              <span class="p-value">${patient?.phone || '-'}</span>
            </div>
          </div>
        </div>

        <div class="main-layout">
          <!-- Left Sidebar: Vitals (Only first page content will exist here) -->
          <div class="sidebar">
            ${vitals ? `
            <div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-size: 11px; font-weight: 700; color: ${isOldVitals ? '#b45309' : '#8B0000'};">
                ${isOldVitals ? 'Old Vitals (From Previous Visit)' : 'Clinical Parameters'}
              </span>
              ${isOldVitals && sourceOpNumber ? `<br/><span style="font-size: 9px; color: #92400e;">From: ${sourceOpNumber}${vitalsVisitDate ? ` (${new Date(vitalsVisitDate).toLocaleDateString('en-IN')})` : ''}</span>` : ''}
            </div>
            ` : ''}
            <div class="v-row"><span class="v-label">SPO2:</span> <span class="v-value">${vitals?.spo2 || ''}%</span></div>
            <div class="v-row"><span class="v-label">PR:</span> <span class="v-value">${vitals?.pulse || ''} mm/mt</span></div>
            <div class="v-row"><span class="v-label">CVS:</span> <span class="v-value">${vitals?.cvs || ''}</span></div>
            <div class="v-row"><span class="v-label">RS:</span> <span class="v-value">${vitals?.rs || ''}</span></div>
            <div class="v-row"><span class="v-label">JVP:</span> <span class="v-value">${vitals?.jvp || ''}</span></div>
            <div class="v-row"><span class="v-label">BP:</span> <span class="v-value">${vitals?.bloodPressure || ''}</span></div>
            <div class="v-row"><span class="v-label">HTN:</span> <span class="v-value">${vitals?.htn || '-'}</span></div>
            <div class="v-row"><span class="v-label">DM:</span> <span class="v-value">${vitals?.dm || '-'}</span></div>
            <div class="v-row"><span class="v-label">SMOKING:</span> <span class="v-value">${vitals?.smoking || '-'}</span></div>
            <div class="v-row"><span class="v-label">THYROID:</span> <span class="v-value">-</span></div>
            <div class="v-row"><span class="v-label">HLP:</span> <span class="v-value">${vitals?.hlp || ''}</span></div>
            <div class="v-row"><span class="v-label">F H/O CAD:</span> <span class="v-value">${vitals?.familyHOCAD || ''}</span></div>
            <div class="v-row"><span class="v-label">HEART DISEASE:</span> <span class="v-value">${vitals?.heartDisease || ''}</span></div>
            <div class="v-row"><span class="v-label">PTCA/CABG:</span> <span class="v-value">${vitals?.ptcaCabg || ''}</span></div>
            <div class="v-row"><span class="v-label">DRUGS:</span> <span class="v-value">${vitals?.currentDrugs || ''}</span></div>
          </div>

          <!-- Right Content: Flowable Prescription sections -->
          <div class="content">
            <div class="rx-sec">
              <div class="rx-sec-title">Complaint:</div>
              <div class="rx-sec-val">${complaint || '-'}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">History:</div>
              <div class="rx-sec-val">${history && history !== 'NULL' ? history : '-'}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Treatment:</div>
              <div class="rx-sec-val">${treatmentText || '-'}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Diagnosis:</div>
              <div class="rx-sec-val">${diagnosis || '-'}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Advice:</div>
              <div class="rx-sec-val">${advice || '-'}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Lab/Investigation:</div>
              <div class="rx-sec-val">${labTests || '-'}</div>
            </div>
          </div>
        </div>

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
          {/* Doctor Header - Matching Reference Design */}
          <Card className="bg-white border border-gray-200 mb-4 overflow-hidden">
            <CardContent className="p-0">
              {/* Tagline */}
              <p className="text-center text-[#8B0000] text-sm font-medium italic py-3">
                30 Years Experience in Treating BP and Heart Diseases
              </p>

              {/* Main Header Content */}
              <div className="flex justify-between items-start px-6 pb-4">
                {/* Left Side - Doctor Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {doctorProfile?.name || user?.name || 'Doctor'}
                  </h2>
                  <p className="text-gray-600 text-sm mb-1">
                    {doctorProfile?.qualification || 'MD, DM, FSCAI (USA)'}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    Regd No: {doctorProfile?.registration_number || '-'}
                  </p>

                  <p className="font-bold text-gray-900 mb-1">
                    {doctorProfile?.speciality || 'Senior Interventional Cardiologist'}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    Medicover Hospitals - Hitech City
                  </p>

                  {/* Contact Details */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <PhoneIcon className="w-3 h-3" />
                      {doctorProfile?.phone || '+91 9848098307'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      www.balajiheartcenter.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      www.facebook.com/balajiheartcenter
                    </p>
                  </div>
                </div>

                {/* Right Side - Logo & Tagline */}
                <div className="flex flex-col items-end">
                  <img
                    src={logo}
                    alt="Balaji Heart Center"
                    className="w-40 h-auto object-contain mb-2"
                  />
                  <p className="text-sm text-gray-600 font-medium">
                    YES, THE 'ADVANTAGE' HEART CLINIC!
                  </p>
                  <p className="text-sm text-[#8B0000] font-medium">
                    మీ గుండె ఇక వదిలం
                  </p>
                </div>
              </div>

              {/* Red Divider Line */}
              <div className="h-1 bg-[#8B0000]"></div>
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
                    {patient?.gender || '-'} / {calculateAge(patient?.dateOfBirth)}
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

          {/* Vitals Display (Read-only from Database with Fallback Support) */}
          <div className="mb-5">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {isOldVitals ? 'Previous Visit Vitals' : 'Clinical Parameters'}
                {vitalsLoading && (
                  <span className="text-xs text-gray-400 font-normal animate-pulse ml-2">Loading...</span>
                )}
              </h3>
              {isOldVitals && sourceOpNumber && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                  From: {sourceOpNumber} {vitalsVisitDate && `(${new Date(vitalsVisitDate).toLocaleDateString('en-IN')})`}
                </span>
              )}
            </div>

            {vitals ? (
              <div className="space-y-3">
                {/* Row 1: Clinical Parameters - 7 Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* SPO2 */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">SPO2</p>
                    <p className={`text-lg font-semibold ${vitals.spo2 && vitals.spo2 < 95 ? 'text-red-600' : 'text-gray-900'}`}>
                      {vitals.spo2 || '-'}{vitals.spo2 && <span className="text-xs font-normal text-gray-500 ml-0.5">%</span>}
                    </p>
                  </div>

                  {/* PR */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">PR</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {vitals.pulse || '-'}{vitals.pulse && <span className="text-xs font-normal text-gray-500 ml-0.5">bpm</span>}
                    </p>
                  </div>

                  {/* BP */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">BP</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {vitals.bloodPressure || '-'}
                    </p>
                  </div>

                  {/* CVS */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CVS</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.cvs || '-'}</p>
                  </div>

                  {/* RS */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">RS</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.rs || '-'}</p>
                  </div>

                  {/* JVP */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">JVP</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.jvp || '-'}</p>
                  </div>

                  {/* HLP */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">HLP</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.hlp || '-'}</p>
                  </div>
                </div>

                {/* Row 2: Risk Factors - 7 Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* HTN */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">HTN</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.htn || '-'}</p>
                  </div>

                  {/* DM */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">DM</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.dm || '-'}</p>
                  </div>

                  {/* Smoking */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Smoking</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.smoking || '-'}</p>
                  </div>

                  {/* F H/O CAD */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">F H/O CAD</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.familyHOCAD || '-'}</p>
                  </div>

                  {/* PTCA/CABG */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">PTCA/CABG</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.ptcaCabg || '-'}</p>
                  </div>

                  {/* Heart Disease */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Heart Disease</p>
                    <p className="text-lg font-semibold text-gray-900">{vitals.heartDisease || '-'}</p>
                  </div>

                  {/* Current Medications */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Medications</p>
                    <p className="text-sm font-semibold text-gray-900 truncate" title={vitals.currentDrugs || '-'}>
                      {vitals.currentDrugs || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <p className="text-sm text-gray-400">
                  {vitalsLoading ? 'Fetching vitals from database...' : 'No vitals recorded for this patient.'}
                </p>
              </div>
            )}
          </div>

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
              {diagnosisSuggestions.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm absolute z-10 w-full max-h-60 overflow-y-auto">
                  {diagnosisSuggestions.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDiagnosis(d.diagnosis)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                    >
                      <div className="flex justify-between">
                        <span>{d.diagnosis}</span>
                        <span className="text-[10px] text-muted-foreground">{d.code}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                ref={diagnosisTextareaRef}
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
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
                readOnly
                className="mt-1 min-h-[60px] resize-none overflow-hidden bg-muted font-mono text-muted-foreground cursor-not-allowed"
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
              {complaintSuggestions.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm absolute z-10 w-full max-h-60 overflow-y-auto">
                  {complaintSuggestions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectComplaint(c.complaint)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                    >
                      <div className="flex justify-between">
                        <span>{c.complaint}</span>
                        <span className="text-[10px] text-muted-foreground">{c.code}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                ref={complaintTextareaRef}
                placeholder="Type complaint or select from suggestions..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
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
                      onClick={() => handleSelectMedicine(m)}
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
                ref={treatmentTextareaRef}
                placeholder="Type medicines manually..."
                value={manualMedicines}
                onChange={(e) => setManualMedicines(e.target.value)}
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
              {labSuggestions.length > 0 && (
                <div className="mt-1 p-2 border rounded-md bg-background shadow-sm absolute z-10 w-full max-h-60 overflow-y-auto">
                  {labSuggestions.map(l => (
                    <button
                      key={l.id}
                      onClick={() => handleSelectLabTest(l.test_name)}
                      className="block w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                    >
                      <div className="flex justify-between">
                        <span>{l.test_name}</span>
                        <span className="text-[10px] text-muted-foreground">{l.code}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                ref={labTextareaRef}
                placeholder="Enter lab tests..."
                value={labTests}
                onChange={(e) => setLabTests(e.target.value)}
                className="mt-2 min-h-[60px] resize-none overflow-hidden"
                rows={2}
              />
            </div>

            {/* Advice */}
            <div>
              <Label className="text-base font-semibold">Advice</Label>
              <Textarea
                ref={adviceTextareaRef}
                placeholder="Enter advice..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
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
          {historyLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>Loading patient history...</p>
              </CardContent>
            </Card>
          ) : patientHistory.length === 0 ? (
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

      {/* Documents List Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Patient Documents - {patient?.firstName} {patient?.lastName}
            </DialogTitle>
          </DialogHeader>

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
                {documents.map((doc, idx) => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/40"
                    onClick={() => {
                      setSelectedDocumentIndex(idx);
                      setShowDocumentViewer(true);
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
                          setSelectedDocumentIndex(idx);
                          setShowDocumentViewer(true);
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
        </DialogContent>
      </Dialog>

      {/* Full-screen Document Viewer */}
      <DocumentViewer
        documents={documents}
        initialIndex={selectedDocumentIndex}
        isOpen={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
      />
    </div>
  );
});
