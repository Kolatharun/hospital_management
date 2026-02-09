import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Activity, Heart, Search, Check, User, Loader2, AlertCircle, UserSearch } from 'lucide-react';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { vitalsService, Vitals, VitalsCreate } from '@/services/vitalsService';
import patientService, { Patient } from '@/services/patientService';

// Validation error display component
interface ValidationErrorProps {
  message: string | null;
}

function ValidationError({ message }: ValidationErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 mt-1.5 p-2.5 bg-destructive text-destructive-foreground rounded-md text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Validation rule interface
interface ValidationRule {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  messages: {
    required?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
}

// Validation rules for vitals form
const VALIDATION_RULES: Record<string, ValidationRule> = {
  spo2: {
    required: false,
    min: 50,
    max: 100,
    pattern: /^\d+$/,
    messages: {
      min: 'SpO2 must be at least 50%',
      max: 'SpO2 cannot exceed 100%',
      pattern: 'SpO2 must be a valid number',
    },
  },
  pulse: {
    required: true,
    min: 30,
    max: 250,
    pattern: /^\d+$/,
    messages: {
      required: 'Pulse rate is required',
      min: 'Pulse must be at least 30 BPM',
      max: 'Pulse cannot exceed 250 BPM',
      pattern: 'Pulse must be a valid number',
    },
  },
  bloodPressure: {
    required: true,
    pattern: /^\d{2,3}\/\d{2,3}$/,
    custom: (value: string) => {
      if (!value) return null;
      if (!value.includes('/')) {
        return 'Blood pressure must be in format: systolic/diastolic (e.g., 120/80)';
      }
      const parts = value.split('/');
      if (parts.length !== 2) {
        return 'Blood pressure must have exactly two values separated by /';
      }
      const systolic = parseInt(parts[0]);
      const diastolic = parseInt(parts[1]);
      if (isNaN(systolic) || isNaN(diastolic)) {
        return 'Blood pressure values must be valid numbers';
      }
      if (systolic < 50 || systolic > 300) {
        return 'Systolic pressure must be between 50 and 300 mmHg';
      }
      if (diastolic < 30 || diastolic > 200) {
        return 'Diastolic pressure must be between 30 and 200 mmHg';
      }
      if (diastolic >= systolic) {
        return 'Systolic pressure must be greater than diastolic pressure';
      }
      return null;
    },
    messages: {
      required: 'Blood pressure is required',
      pattern: 'Blood pressure must be in format: systolic/diastolic (e.g., 120/80)',
    },
  },
  weight: {
    required: false,
    min: 1,
    max: 500,
    pattern: /^\d+(\.\d{1,2})?$/,
    messages: {
      min: 'Weight must be at least 1 kg',
      max: 'Weight cannot exceed 500 kg',
      pattern: 'Weight must be a valid number (up to 2 decimal places)',
    },
  },
  cvs: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 100) {
        return 'CVS description cannot exceed 100 characters';
      }
      return null;
    },
  },
  rs: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 100) {
        return 'RS description cannot exceed 100 characters';
      }
      return null;
    },
  },
  jvp: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 50) {
        return 'JVP description cannot exceed 50 characters';
      }
      return null;
    },
  },
  hlp: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 50) {
        return 'HLP description cannot exceed 50 characters';
      }
      return null;
    },
  },
  htn: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 50) {
        return 'HTN description cannot exceed 50 characters';
      }
      return null;
    },
  },
  dm: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 50) {
        return 'DM description cannot exceed 50 characters';
      }
      return null;
    },
  },
  smoking: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 50) {
        return 'Smoking status cannot exceed 50 characters';
      }
      return null;
    },
  },
  familyHOCAD: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 100) {
        return 'Family H/O CAD description cannot exceed 100 characters';
      }
      return null;
    },
  },
  heartDisease: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 100) {
        return 'Heart Disease description cannot exceed 100 characters';
      }
      return null;
    },
  },
  ptcaCabg: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 100) {
        return 'PTCA/CABG description cannot exceed 100 characters';
      }
      return null;
    },
  },
  currentDrugs: {
    required: false,
    messages: {},
    custom: (value: string) => {
      if (value && value.length > 500) {
        return 'Current drugs list cannot exceed 500 characters';
      }
      return null;
    },
  },
};

type FormField = keyof typeof VALIDATION_RULES;
type FormErrors = Record<string, string | null>;

export function VitalsCollection() {
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('waiting');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitalsRecords, setVitalsRecords] = useState<Vitals[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalsSearchQuery, setVitalsSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient search states
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);

  // Validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [vitalsForm, setVitalsForm] = useState({
    spo2: '',
    pulse: '',
    bloodPressure: '',
    cvs: '',
    rs: '',
    jvp: '',
    weight: '',
    hlp: '',
    htn: '',
    dm: '',
    smoking: '',
    familyHOCAD: '',
    heartDisease: '',
    ptcaCabg: '',
    currentDrugs: '',
  });

  // --- Validation logic ---
  const validateField = useCallback((field: FormField, value: string): string | null => {
    const rule = VALIDATION_RULES[field];
    if (!rule) return null;

    // Required check
    if (rule.required && !value.trim()) {
      return rule.messages.required || `${field} is required`;
    }

    // Skip further checks if empty and not required
    if (!value.trim()) return null;

    // Custom validator (runs first for complex fields like BP)
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) return customError;
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.messages.pattern || `Invalid format for ${field}`;
    }

    // Min/Max range checks (for numeric fields)
    if (rule.min !== undefined || rule.max !== undefined) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (rule.min !== undefined && numValue < rule.min) {
          return rule.messages.min || `Value must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && numValue > rule.max) {
          return rule.messages.max || `Value cannot exceed ${rule.max}`;
        }
      }
    }

    return null;
  }, []);

  const handleChange = useCallback((field: string, value: string) => {
    setVitalsForm(prev => ({ ...prev, [field]: value }));

    // Validate on change if field was already touched
    if (touchedFields.has(field)) {
      const error = validateField(field as FormField, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [touchedFields, validateField]);

  const handleBlur = useCallback((field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const value = vitalsForm[field as keyof typeof vitalsForm];
    const error = validateField(field as FormField, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  }, [vitalsForm, validateField]);

  const validateAllFields = useCallback((): boolean => {
    const errors: FormErrors = {};
    let hasErrors = false;
    const allFields = new Set<string>();

    for (const field of Object.keys(VALIDATION_RULES)) {
      allFields.add(field);
      const value = vitalsForm[field as keyof typeof vitalsForm];
      const error = validateField(field as FormField, value);
      errors[field] = error;
      if (error) hasErrors = true;
    }

    setFormErrors(errors);
    setTouchedFields(allFields);
    return !hasErrors;
  }, [vitalsForm, validateField]);

  // --- Data loading ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, vitalsData] = await Promise.all([
        appointmentService.getTodayAppointments(undefined, 'waiting'),
        vitalsService.getTodayVitals(),
      ]);
      setAppointments(appointmentsData);
      setVitalsRecords(vitalsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Failed to Load Data',
        description: 'Could not load today\'s appointments and vitals. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Patient search from database (debounced) ---
  useEffect(() => {
    if (!patientSearchQuery.trim() || patientSearchQuery.trim().length < 2) {
      setPatientSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearchingPatients(true);
      try {
        const response = await patientService.search(patientSearchQuery.trim(), 'all', 0, 20);
        setPatientSearchResults(response.patients || []);
      } catch (error) {
        console.error('Patient search failed:', error);
        toast({
          title: 'Search Failed',
          description: 'Could not search patients from database. Please try again.',
          variant: 'destructive',
        });
        setPatientSearchResults([]);
      } finally {
        setIsSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [patientSearchQuery]);

  // Filter waiting appointments that don't have vitals recorded yet
  const waitingAppointments = appointments.filter(
    apt => !vitalsRecords.find(v => v.appointment_id === apt.id)
  );

  const filteredAppointments = waitingAppointments.filter(
    apt =>
      (apt.patient_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (apt.patient_mr_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Filter vitals records by search query
  const filteredVitalsRecords = vitalsRecords.filter(record => {
    if (!vitalsSearchQuery.trim()) return true;
    const query = vitalsSearchQuery.toLowerCase();
    return (
      (record.patient_name?.toLowerCase() || '').includes(query) ||
      (record.patient_mr_number?.toLowerCase() || '').includes(query) ||
      (record.blood_pressure?.toLowerCase() || '').includes(query) ||
      (record.op_number?.toLowerCase() || '').includes(query)
    );
  });

  const handleSelectPatient = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormErrors({});
    setTouchedFields(new Set());
    setVitalsForm({
      spo2: '',
      pulse: '',
      bloodPressure: '',
      cvs: 'S1 S2 Normal',
      rs: 'Clear',
      jvp: 'Normal',
      weight: '',
      hlp: '',
      htn: '',
      dm: '',
      smoking: '',
      familyHOCAD: '',
      heartDisease: '',
      ptcaCabg: '',
      currentDrugs: '',
    });
  };

  const handleCancelForm = () => {
    setSelectedAppointment(null);
    setFormErrors({});
    setTouchedFields(new Set());
  };

  const handleSaveVitals = async () => {
    if (!selectedAppointment) return;

    // Run full validation
    if (!validateAllFields()) {
      // Find the first error message to show in toast
      let firstError = '';
      for (const field of Object.keys(VALIDATION_RULES)) {
        const value = vitalsForm[field as keyof typeof vitalsForm];
        const error = validateField(field as FormField, value);
        if (error) {
          firstError = error;
          break;
        }
      }

      toast({
        description: firstError || 'Please fix the highlighted errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const vitalsData: VitalsCreate = {
        appointment_id: selectedAppointment.id,
        pulse: Number(vitalsForm.pulse),
        blood_pressure: vitalsForm.bloodPressure,
        spo2: vitalsForm.spo2 ? Number(vitalsForm.spo2) : undefined,
        cvs: vitalsForm.cvs || undefined,
        rs: vitalsForm.rs || undefined,
        jvp: vitalsForm.jvp || undefined,
        weight: vitalsForm.weight ? Number(vitalsForm.weight) : undefined,
        hlp: vitalsForm.hlp || undefined,
        htn: vitalsForm.htn || undefined,
        dm: vitalsForm.dm || undefined,
        smoking: vitalsForm.smoking || undefined,
        family_ho_cad: vitalsForm.familyHOCAD || undefined,
        heart_disease: vitalsForm.heartDisease || undefined,
        ptca_cabg: vitalsForm.ptcaCabg || undefined,
        current_drugs: vitalsForm.currentDrugs || undefined,
      };

      const savedVitals = await vitalsService.record(vitalsData);

      // Update local state
      setVitalsRecords(prev => [savedVitals, ...prev]);
      setSelectedAppointment(null);
      setFormErrors({});
      setTouchedFields(new Set());

      toast({
        title: 'Vitals Recorded Successfully',
        description: `Vitals for ${selectedAppointment.patient_name} (MR: ${selectedAppointment.patient_mr_number}) have been saved.`,
      });
    } catch (error: any) {
      console.error('Failed to save vitals:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to save vitals. Please try again.';
      toast({
        title: 'Failed to Save Vitals',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSpo2Status = (spo2: number) => {
    if (spo2 >= 95) return { label: 'Normal', color: 'bg-success/20 text-success border-success/30' };
    if (spo2 >= 90) return { label: 'Low', color: 'bg-warning/20 text-warning border-warning/30' };
    return { label: 'Critical', color: 'bg-destructive/20 text-destructive border-destructive/30' };
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');
  };

  // Helper to check if a field has error (for styling)
  const hasError = (field: string) => touchedFields.has(field) && !!formErrors[field];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="medical-section space-y-6">
      {/* Header */}
      {selectedAppointment && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Vitals Collection</h2>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">OP: </span>
              <span className="font-semibold text-primary">{selectedAppointment.op_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Patient: </span>
              <span className="font-semibold">{selectedAppointment.patient_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">MR: </span>
              <span className="font-semibold">{selectedAppointment.patient_mr_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date: </span>
              <span className="font-semibold">{formatDate()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Record Vitals Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-4 h-4" />
              Record Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedAppointment ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="waiting">Waiting Patients</TabsTrigger>
                  <TabsTrigger value="search">Search Patient</TabsTrigger>
                </TabsList>

                {/* Tab 1: Waiting Appointments */}
                <TabsContent value="waiting" className="space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter waiting patients by name or MR number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredAppointments.length === 0 ? (
                      <p className="col-span-full text-center text-muted-foreground py-4">
                        No waiting patients without vitals
                      </p>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleSelectPatient(apt)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{apt.patient_name}</p>
                              <p className="text-sm text-muted-foreground">{apt.patient_mr_number}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="font-bold hover:bg-primary hover:text-primary-foreground">Record</Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Tab 2: Search Registered Patients from DB */}
                <TabsContent value="search" className="space-y-4">
                  <div className="relative max-w-md">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by patient name, phone, or MR number..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {patientSearchQuery.trim().length > 0 && patientSearchQuery.trim().length < 2 && (
                    <p className="text-sm text-muted-foreground">Type at least 2 characters to search...</p>
                  )}

                  {isSearchingPatients && (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching patients...</span>
                    </div>
                  )}

                  {!isSearchingPatients && patientSearchQuery.trim().length >= 2 && patientSearchResults.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No registered patients found for "{patientSearchQuery}"
                    </p>
                  )}

                  {patientSearchResults.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/10">
                            <TableHead className="font-bold text-primary">Patient Name</TableHead>
                            <TableHead className="font-bold text-primary">MR Number</TableHead>
                            <TableHead className="font-bold text-primary">Phone</TableHead>
                            <TableHead className="font-bold text-primary">Gender</TableHead>
                            <TableHead className="font-bold text-primary">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patientSearchResults.map((patient) => (
                            <TableRow key={patient.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">
                                {patient.first_name} {patient.last_name}
                              </TableCell>
                              <TableCell>{patient.mr_number}</TableCell>
                              <TableCell>{patient.phone}</TableCell>
                              <TableCell className="capitalize">{patient.gender}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="font-bold hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => {
                                    // Find matching appointment for this patient
                                    const matchingApt = appointments.find(
                                      apt => apt.patient_mr_number === patient.mr_number
                                    );
                                    if (matchingApt) {
                                      handleSelectPatient(matchingApt);
                                    } else {
                                      toast({
                                        title: 'No Appointment Found',
                                        description: `${patient.first_name} ${patient.last_name} (MR: ${patient.mr_number}) does not have a waiting appointment today. Please register an appointment first.`,
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  Record
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-6">
                {/* Primary Vitals Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>SPO2 (%)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="98"
                      value={vitalsForm.spo2}
                      onChange={(e) => handleChange('spo2', e.target.value)}
                      onBlur={() => handleBlur('spo2')}
                      className={hasError('spo2') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('spo2') && <ValidationError message={formErrors.spo2 || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>PR (BPM) <span className="text-destructive">*</span></Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="72"
                      value={vitalsForm.pulse}
                      onChange={(e) => handleChange('pulse', e.target.value)}
                      onBlur={() => handleBlur('pulse')}
                      className={hasError('pulse') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('pulse') && <ValidationError message={formErrors.pulse || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>BP (mmHg) <span className="text-destructive">*</span></Label>
                    <Input
                      type="text"
                      placeholder="120/80"
                      value={vitalsForm.bloodPressure}
                      onChange={(e) => handleChange('bloodPressure', e.target.value)}
                      onBlur={() => handleBlur('bloodPressure')}
                      className={hasError('bloodPressure') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('bloodPressure') && <ValidationError message={formErrors.bloodPressure || null} />}
                  </div>
                </div>

                {/* Secondary Vitals Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CVS</Label>
                    <Input
                      placeholder="S1 S2 Normal"
                      value={vitalsForm.cvs}
                      onChange={(e) => handleChange('cvs', e.target.value)}
                      onBlur={() => handleBlur('cvs')}
                      className={hasError('cvs') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('cvs') && <ValidationError message={formErrors.cvs || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>RS</Label>
                    <Input
                      placeholder="Clear"
                      value={vitalsForm.rs}
                      onChange={(e) => handleChange('rs', e.target.value)}
                      onBlur={() => handleBlur('rs')}
                      className={hasError('rs') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('rs') && <ValidationError message={formErrors.rs || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>JVP</Label>
                    <Input
                      placeholder="Normal"
                      value={vitalsForm.jvp}
                      onChange={(e) => handleChange('jvp', e.target.value)}
                      onBlur={() => handleBlur('jvp')}
                      className={hasError('jvp') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('jvp') && <ValidationError message={formErrors.jvp || null} />}
                  </div>
                </div>

                {/* Weight and HLP Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (Kg)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="70"
                      value={vitalsForm.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      onBlur={() => handleBlur('weight')}
                      className={hasError('weight') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('weight') && <ValidationError message={formErrors.weight || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>HLP</Label>
                    <Input
                      placeholder="Status"
                      value={vitalsForm.hlp}
                      onChange={(e) => handleChange('hlp', e.target.value)}
                      onBlur={() => handleBlur('hlp')}
                      className={hasError('hlp') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('hlp') && <ValidationError message={formErrors.hlp || null} />}
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="p-4 rounded-lg bg-muted/30 border space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Medical History</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>HTN (Hypertension)</Label>
                      <Input
                        placeholder="e.g., Yes / No / Stage II / Controlled"
                        value={vitalsForm.htn}
                        onChange={(e) => handleChange('htn', e.target.value)}
                        onBlur={() => handleBlur('htn')}
                        className={hasError('htn') ? 'border-destructive' : ''}
                      />
                      {touchedFields.has('htn') && <ValidationError message={formErrors.htn || null} />}
                    </div>
                    <div className="space-y-2">
                      <Label>DM (Diabetes)</Label>
                      <Input
                        placeholder="e.g., Yes / No / Type 2"
                        value={vitalsForm.dm}
                        onChange={(e) => handleChange('dm', e.target.value)}
                        onBlur={() => handleBlur('dm')}
                        className={hasError('dm') ? 'border-destructive' : ''}
                      />
                      {touchedFields.has('dm') && <ValidationError message={formErrors.dm || null} />}
                    </div>
                    <div className="space-y-2">
                      <Label>Smoking</Label>
                      <Input
                        placeholder="e.g., Yes / No / Former smoker"
                        value={vitalsForm.smoking}
                        onChange={(e) => handleChange('smoking', e.target.value)}
                        onBlur={() => handleBlur('smoking')}
                        className={hasError('smoking') ? 'border-destructive' : ''}
                      />
                      {touchedFields.has('smoking') && <ValidationError message={formErrors.smoking || null} />}
                    </div>
                  </div>
                </div>

                {/* Additional Medical History */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Family H/O CAD</Label>
                    <Input
                      placeholder="Family history"
                      value={vitalsForm.familyHOCAD}
                      onChange={(e) => handleChange('familyHOCAD', e.target.value)}
                      onBlur={() => handleBlur('familyHOCAD')}
                      className={hasError('familyHOCAD') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('familyHOCAD') && <ValidationError message={formErrors.familyHOCAD || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>Heart Disease</Label>
                    <Input
                      placeholder="Details if any"
                      value={vitalsForm.heartDisease}
                      onChange={(e) => handleChange('heartDisease', e.target.value)}
                      onBlur={() => handleBlur('heartDisease')}
                      className={hasError('heartDisease') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('heartDisease') && <ValidationError message={formErrors.heartDisease || null} />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PTCA / CABG</Label>
                    <Input
                      placeholder="Previous procedures"
                      value={vitalsForm.ptcaCabg}
                      onChange={(e) => handleChange('ptcaCabg', e.target.value)}
                      onBlur={() => handleBlur('ptcaCabg')}
                      className={hasError('ptcaCabg') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('ptcaCabg') && <ValidationError message={formErrors.ptcaCabg || null} />}
                  </div>
                  <div className="space-y-2">
                    <Label>Current Drugs</Label>
                    <Input
                      placeholder="Current medications"
                      value={vitalsForm.currentDrugs}
                      onChange={(e) => handleChange('currentDrugs', e.target.value)}
                      onBlur={() => handleBlur('currentDrugs')}
                      className={hasError('currentDrugs') ? 'border-destructive' : ''}
                    />
                    {touchedFields.has('currentDrugs') && <ValidationError message={formErrors.currentDrugs || null} />}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveVitals}
                    disabled={isSubmitting}
                    className="gap-2 font-bold hover:scale-[1.02] transition-transform"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Saving...' : 'Save Vitals'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                    className="font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Vitals Records */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-4 h-4" />
                Today's Vitals
                <Badge className="ml-2">{vitalsRecords.length}</Badge>
              </CardTitle>
              {vitalsRecords.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recorded vitals..."
                    value={vitalsSearchQuery}
                    onChange={(e) => setVitalsSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {vitalsRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No vitals recorded today yet.</p>
            ) : filteredVitalsRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No vitals records match "{vitalsSearchQuery}"
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      <TableHead className="font-bold text-primary">Patient</TableHead>
                      <TableHead className="font-bold text-primary">BP</TableHead>
                      <TableHead className="font-bold text-primary">Pulse</TableHead>
                      <TableHead className="font-bold text-primary">SpO2</TableHead>
                      <TableHead className="font-bold text-primary">Weight</TableHead>
                      <TableHead className="font-bold text-primary">CVS/RS</TableHead>
                      <TableHead className="font-bold text-primary">HTN/DM</TableHead>
                      <TableHead className="font-bold text-primary">Smoking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVitalsRecords.map((record) => {
                      const spo2Status = record.spo2 ? getSpo2Status(record.spo2) : null;

                      return (
                        <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.patient_name}</p>
                              <p className="text-xs text-muted-foreground">{record.patient_mr_number}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{record.blood_pressure}</TableCell>
                          <TableCell className="font-mono">{record.pulse} bpm</TableCell>
                          <TableCell>
                            {record.spo2 && spo2Status ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{record.spo2}%</span>
                                <Badge className={spo2Status.color}>{spo2Status.label}</Badge>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{record.weight ? `${record.weight} kg` : '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>CVS: {record.cvs || '-'}</p>
                              <p>RS: {record.rs || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.htn && <p>HTN: {record.htn}</p>}
                              {record.dm && <p>DM: {record.dm}</p>}
                              {!record.htn && !record.dm && '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.smoking || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
