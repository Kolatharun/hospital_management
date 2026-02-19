import { useState, useMemo, useEffect, useCallback } from 'react';
import { useClinicData, Patient } from '@/contexts/ClinicDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Save, RotateCcw, X, Stethoscope, Search, History, Calendar, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import patientService, { Patient as ApiPatient } from '@/services/patientService';
import appointmentService from '@/services/appointmentService';
import { RegistrationToBillingData } from '@/pages/FrontOfficeDashboard';

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
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  messages: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
  };
}

// Validation rules
const VALIDATION_RULES: Record<string, ValidationRule> = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    messages: {
      required: 'First name is required',
      minLength: 'First name must be at least 2 characters',
      maxLength: 'First name cannot exceed 50 characters',
      pattern: 'First name should contain only letters',
    },
  },
  lastName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    messages: {
      required: 'Last name is required',
      minLength: 'Last name must be at least 1 character',
      maxLength: 'Last name cannot exceed 50 characters',
      pattern: 'Last name should contain only letters',
    },
  },
  phone: {
    required: true,
    pattern: /^(\+91\s?)?[6-9]\d{9}$/,
    messages: {
      required: 'Phone number is required',
      pattern: 'Please enter a valid Indian phone number (10 digits starting with 6-9)',
    },
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      pattern: 'Please enter a valid email address',
    },
  },
  emergencyContact: {
    required: false,
    pattern: /^(\+91\s?)?[6-9]\d{9}$/,
    messages: {
      pattern: 'Please enter a valid Indian phone number (10 digits starting with 6-9)',
    },
  },
  dateOfBirth: {
    required: false,
    custom: (value: string) => {
      if (!value) return null;
      const date = new Date(value);
      const today = new Date();
      if (date > today) return 'Date of birth cannot be in the future';
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (date < minDate) return 'Please enter a valid date of birth';
      return null;
    },
    messages: {},
  },
  gender: {
    required: true,
    messages: {
      required: 'Gender is required',
    },
  },
  address: {
    required: false,
    maxLength: 200,
    messages: {
      maxLength: 'Address cannot exceed 200 characters',
    },
  },
  city: {
    required: false,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    messages: {
      maxLength: 'City name cannot exceed 50 characters',
      pattern: 'City name should contain only letters',
    },
  },
  state: {
    required: false,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]*$/,
    messages: {
      maxLength: 'State name cannot exceed 50 characters',
      pattern: 'State name should contain only letters',
    },
  },
  pinCode: {
    required: false,
    pattern: /^[1-9][0-9]{5}$/,
    messages: {
      pattern: 'Please enter a valid 6-digit PIN code',
    },
  },
  department: {
    required: true,
    messages: {
      required: 'Please select a department',
    },
  },
  preferredDoctor: {
    required: true,
    messages: {
      required: 'Please select a doctor',
    },
  },
};

type FormField = keyof typeof VALIDATION_RULES;
type FormErrors = Record<string, string | null>;

// Interface for history appointment response
interface HistoryAppointment {
  id: string;
  op_number: string;
  patient_id: string;
  patient_name: string;
  patient_mr_number: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number: number;
}

interface PatientRegistrationProps {
  onRegistrationComplete?: (data: RegistrationToBillingData) => void;
}

export function PatientRegistration({ onRegistrationComplete }: PatientRegistrationProps) {
  const { addPatient, patients, appointments, departments, doctors } = useClinicData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('new');
  const [existingMRSearch, setExistingMRSearch] = useState('');
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<typeof patients[0] | null>(null);
  const [historyDate, setHistoryDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Search states
  const [searchResults, setSearchResults] = useState<ApiPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // History states
  const [historyAppointments, setHistoryAppointments] = useState<HistoryAppointment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Get default department and doctor
  const defaultDepartment = departments[0]?.id || '';
  const defaultDoctor = doctors[0]?.id || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    maritalStatus: 'Single' as 'Single' | 'Married' | 'Widowed' | 'Divorced',
    patientType: 'New' as 'New' | 'Review' | 'Emergency',
    address: '',
    city: '',
    state: 'Telangana',
    pinCode: '',
    department: defaultDepartment,
    preferredDoctor: defaultDoctor,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<FormField>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((field: FormField, value: string): string | null => {
    const rules = VALIDATION_RULES[field];
    if (!rules) return null;

    // Check required
    if (rules.required && (!value || value.trim() === '')) {
      return rules.messages?.required || `${field} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') return null;

    // Check min length
    if ('minLength' in rules && rules.minLength && value.length < rules.minLength) {
      return rules.messages?.minLength || `Minimum ${rules.minLength} characters required`;
    }

    // Check max length
    if ('maxLength' in rules && rules.maxLength && value.length > rules.maxLength) {
      return rules.messages?.maxLength || `Maximum ${rules.maxLength} characters allowed`;
    }

    // Check pattern
    if ('pattern' in rules && rules.pattern && !rules.pattern.test(value.replace(/\s/g, ''))) {
      return rules.messages?.pattern || 'Invalid format';
    }

    // Check custom validation
    if ('custom' in rules && rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return null;
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when field is modified
    if (touchedFields.has(field as FormField)) {
      const error = validateField(field as FormField, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: FormField) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const value = formData[field as keyof typeof formData] || '';
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  // Search existing patients from backend
  const searchExistingPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await patientService.search(query);
      setSearchResults(response.patients || []);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to search patients');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (existingMRSearch) {
        searchExistingPatients(existingMRSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [existingMRSearch, searchExistingPatients]);

  // Helper function to map API appointment to history format
  const mapApiAppointmentToHistory = (apt: Awaited<ReturnType<typeof appointmentService.getTodayAppointments>>[0]): HistoryAppointment => ({
    id: apt.id,
    op_number: apt.op_number || '',
    patient_id: apt.patient_id,
    patient_name: apt.patient_name || '',
    patient_mr_number: apt.patient_mr_number || '',
    doctor_name: apt.doctor_name || '',
    appointment_date: apt.appointment_date,
    appointment_time: apt.appointment_time || '',
    status: apt.status,
    token_number: apt.token_number || 0,
  });

  // Helper function to map local appointment to history format
  const mapLocalAppointmentToHistory = (apt: typeof appointments[0]): HistoryAppointment => ({
    id: apt.id,
    op_number: apt.opNumber || '',
    patient_id: apt.patientId,
    patient_name: `${apt.patient.firstName} ${apt.patient.lastName}`,
    patient_mr_number: apt.patient.mrNumber,
    doctor_name: apt.doctorName,
    appointment_date: apt.date,
    appointment_time: apt.time,
    status: apt.status,
    token_number: apt.tokenNumber || 0,
  });

  // Fetch history appointments by date from backend
  const fetchHistoryByDate = useCallback(async (date: string) => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    const today = format(new Date(), 'yyyy-MM-dd');
    const isToday = date === today;

    try {
      let response;

      if (isToday) {
        // Use getTodayAppointments for today's date (more reliable)
        response = await appointmentService.getTodayAppointments();
      } else {
        // Try getAppointmentsByDate for historical dates
        response = await appointmentService.getAppointmentsByDate(date);
      }

      if (response && response.length > 0) {
        setHistoryAppointments(response.map(mapApiAppointmentToHistory));
      } else {
        // API returned empty, use local data for today
        if (isToday) {
          const localAppointments = appointments.filter(apt => apt.date === date);
          setHistoryAppointments(localAppointments.map(mapLocalAppointmentToHistory));
        } else {
          setHistoryAppointments([]);
        }
      }
    } catch {
      // API failed
      if (isToday) {
        // Fallback to local appointments for today
        const localAppointments = appointments.filter(apt => apt.date === date);
        setHistoryAppointments(localAppointments.map(mapLocalAppointmentToHistory));
      } else {
        // For historical dates, show appropriate message
        setHistoryAppointments([]);
        setHistoryError('Historical appointment data is not available. Please contact administrator.');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [appointments]);

  // Fetch history when date changes
  useEffect(() => {
    if (activeTab === 'history' && historyDate) {
      fetchHistoryByDate(historyDate);
    }
  }, [activeTab, historyDate, fetchHistoryByDate]);

  // Update default department and doctor when data loads
  useEffect(() => {
    if (departments.length > 0 && !formData.department) {
      const firstDept = departments[0];
      const firstDoctor = doctors.find(d => d.department_id === firstDept.id) || doctors[0];
      setFormData(prev => ({
        ...prev,
        department: firstDept.id,
        preferredDoctor: firstDoctor?.id || '',
      }));
    }
  }, [departments, doctors]);

  // Filter doctors based on selected department
  const availableDoctors = useMemo(() => {
    if (!formData.department) return doctors;
    return doctors.filter(doc => doc.department_id === formData.department);
  }, [formData.department, doctors]);

  // Map API patient to frontend patient format
  const mapApiPatientToPatient = (apiPatient: ApiPatient) => ({
    id: apiPatient.id,
    mrNumber: apiPatient.mr_number,
    firstName: apiPatient.first_name,
    lastName: apiPatient.last_name,
    phone: apiPatient.phone,
    email: apiPatient.email || undefined,
    dateOfBirth: apiPatient.date_of_birth || undefined,
    gender: apiPatient.gender as 'Male' | 'Female' | 'Other',
    maritalStatus: apiPatient.marital_status as 'Single' | 'Married' | 'Widowed' | 'Divorced' | undefined,
    patientType: apiPatient.patient_type as 'New' | 'Review' | 'Emergency' | undefined,
    emergencyContact: apiPatient.emergency_contact || undefined,
    address: apiPatient.address || undefined,
    city: apiPatient.city || undefined,
    state: apiPatient.state || undefined,
    pinCode: apiPatient.pin_code || undefined,
    createdAt: apiPatient.created_at,
  });

  const handleSelectExistingPatient = async (apiPatient: ApiPatient) => {
    try {
      // Fetch complete patient details from backend
      const fullPatientData = await patientService.getById(apiPatient.id);
      const patient = mapApiPatientToPatient(fullPatientData);

      setSelectedExistingPatient(patient);

      // Auto-populate ALL fields from the patient data
      setFormData(prev => ({
        ...prev,
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        phone: patient.phone || '',
        email: patient.email || '',
        emergencyContact: patient.emergencyContact || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || 'Male',
        maritalStatus: patient.maritalStatus || 'Single',
        patientType: 'Review', // Set to Review for existing patients
        address: patient.address || '',
        city: patient.city || '',
        state: patient.state || 'Telangana',
        pinCode: patient.pinCode || '',
      }));

      setExistingMRSearch('');
      setSearchResults([]);

      // Clear any validation errors
      setFormErrors({});
      setTouchedFields(new Set());

      toast({
        title: 'Patient Selected',
        description: `${patient.firstName} ${patient.lastName} (${patient.mrNumber}) details loaded successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patient details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields and get list of fields with errors
    const errors: FormErrors = {};
    const errorFieldNames: string[] = [];
    const fieldLabels: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      email: 'Email',
      emergencyContact: 'Emergency Contact',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      address: 'Address',
      city: 'City',
      state: 'State',
      pinCode: 'Pin Code',
      department: 'Department',
      preferredDoctor: 'Doctor',
    };

    (Object.keys(VALIDATION_RULES) as FormField[]).forEach((field) => {
      const value = formData[field as keyof typeof formData] || '';
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        errorFieldNames.push(fieldLabels[field] || field);
      }
    });

    setFormErrors(errors);
    setTouchedFields(new Set(Object.keys(VALIDATION_RULES) as FormField[]));

    if (errorFieldNames.length > 0) {
      toast({
        description: `Please fill the details: ${errorFieldNames.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let patientToUse: Patient = selectedExistingPatient as Patient;

      if (!patientToUse) {
        patientToUse = await addPatient({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          patientType: formData.patientType,
          emergencyContact: formData.emergencyContact || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          pinCode: formData.pinCode || undefined,
        });
      }

      // Get selected doctor info
      const selectedDoctor = doctors.find(doc => doc.id === formData.preferredDoctor) || doctors[0];

      // If callback is provided, redirect to billing (new flow)
      // Queue entry will happen after billing is completed
      if (onRegistrationComplete) {
        toast({
          title: 'Registration Successful',
          description: `Patient ${patientToUse.firstName} ${patientToUse.lastName} (${patientToUse.mrNumber}) registered. Redirecting to billing...`,
        });

        // Pass patient data to billing
        onRegistrationComplete({
          patient: patientToUse,
          doctorId: selectedDoctor?.id || '',
          doctorName: selectedDoctor?.name || '',
        });

        // Reset form
        handleClear();
      } else {
        // Fallback: Legacy behavior - show success message only
        toast({
          title: 'Registration Successful',
          description: `Patient ${patientToUse.firstName} ${patientToUse.lastName} (${patientToUse.mrNumber}) registered successfully.`,
        });

        // Reset form
        handleClear();
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      emergencyContact: '',
      dateOfBirth: '',
      gender: 'Male',
      maritalStatus: 'Single',
      patientType: 'New',
      address: '',
      city: '',
      state: 'Telangana',
      pinCode: '',
      department: departments[0]?.id || '',
      preferredDoctor: doctors[0]?.id || '',
    });
    setSelectedExistingPatient(null);
    setExistingMRSearch('');
    setSearchResults([]);
    setFormErrors({});
    setTouchedFields(new Set());
  };

  // Get error for a field (only show if touched)
  const getFieldError = (field: FormField): string | null => {
    return touchedFields.has(field) ? formErrors[field] || null : null;
  };

  return (
    <div className="medical-section">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">OP Registration</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="new" className="gap-2">
            <User className="w-4 h-4" />
            New Registration
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Registration History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Identity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-4 h-4" />
                    Patient Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Existing Patient */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Search className="w-3 h-3" />
                      Search Existing Patient
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by MR Number, OP Number, Phone, Email, or Name..."
                        value={existingMRSearch}
                        onChange={(e) => setExistingMRSearch(e.target.value)}
                        className="pl-10"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {searchError && (
                      <div className="flex items-center gap-2 p-2 bg-destructive text-destructive-foreground rounded-md text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{searchError}</span>
                      </div>
                    )}

                    {searchResults.length > 0 && !selectedExistingPatient && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-background shadow-lg">
                        {searchResults.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSelectExistingPatient(patient)}
                          >
                            <div>
                              <p className="font-semibold text-sm">{patient.first_name} {patient.last_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.mr_number} | {patient.phone} | {patient.gender}
                                {patient.date_of_birth && ` | DOB: ${format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}`}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs">Select</Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {existingMRSearch.length >= 2 && !isSearching && searchResults.length === 0 && !searchError && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        No patients found matching "{existingMRSearch}"
                      </div>
                    )}

                    {selectedExistingPatient && (
                      <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {selectedExistingPatient.firstName} {selectedExistingPatient.lastName} ({selectedExistingPatient.mrNumber})
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedExistingPatient(null);
                            setExistingMRSearch('');
                            handleClear();
                          }}
                          className="h-6 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4" />

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        className={getFieldError('firstName') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('firstName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        onBlur={() => handleBlur('lastName')}
                        className={getFieldError('lastName') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('lastName')} />
                    </div>
                  </div>

                  {/* DOB, Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        onBlur={() => handleBlur('dateOfBirth')}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className={getFieldError('dateOfBirth') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('dateOfBirth')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">
                        Gender <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => {
                          handleChange('gender', value);
                          handleBlur('gender');
                        }}
                      >
                        <SelectTrigger className={getFieldError('gender') ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <ValidationError message={getFieldError('gender')} />
                    </div>
                  </div>

                  {/* Marital Status, Patient Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => handleChange('maritalStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientType">Patient Type</Label>
                      <Select
                        value={formData.patientType}
                        onValueChange={(value) => handleChange('patientType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New Patient</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="w-4 h-4" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9999999999"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={getFieldError('phone') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('phone')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        type="tel"
                        placeholder="+91 9999999999"
                        value={formData.emergencyContact}
                        onChange={(e) => handleChange('emergencyContact', e.target.value)}
                        onBlur={() => handleBlur('emergencyContact')}
                        className={getFieldError('emergencyContact') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('emergencyContact')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email ID</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={getFieldError('email') ? 'border-destructive' : ''}
                    />
                    <ValidationError message={getFieldError('email')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      onBlur={() => handleBlur('address')}
                      className={getFieldError('address') ? 'border-destructive' : ''}
                    />
                    <ValidationError message={getFieldError('address')} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        onBlur={() => handleBlur('city')}
                        className={getFieldError('city') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('city')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        onBlur={() => handleBlur('state')}
                        className={getFieldError('state') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('state')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">Pin Code</Label>
                      <Input
                        id="pinCode"
                        placeholder="Pin Code"
                        value={formData.pinCode}
                        onChange={(e) => handleChange('pinCode', e.target.value)}
                        onBlur={() => handleBlur('pinCode')}
                        maxLength={6}
                        className={getFieldError('pinCode') ? 'border-destructive' : ''}
                      />
                      <ValidationError message={getFieldError('pinCode')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department & Doctor Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="w-4 h-4" />
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">
                        Department <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => {
                          handleChange('department', value);
                          handleBlur('department');
                          const firstDoctor = doctors.find(d => d.department_id === value);
                          if (firstDoctor) {
                            handleChange('preferredDoctor', firstDoctor.id);
                          }
                        }}
                      >
                        <SelectTrigger className={getFieldError('department') ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ValidationError message={getFieldError('department')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredDoctor">
                        Preferred Doctor <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.preferredDoctor}
                        onValueChange={(value) => {
                          handleChange('preferredDoctor', value);
                          handleBlur('preferredDoctor');
                        }}
                      >
                        <SelectTrigger className={getFieldError('preferredDoctor') ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDoctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name} - {doc.department_name || ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ValidationError message={getFieldError('preferredDoctor')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Save & Next
              </Button>
              <Button type="button" variant="outline" onClick={handleClear} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
              <Button type="button" variant="ghost" onClick={handleClear} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-4 h-4" />
                OP Registration History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-auto"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchHistoryByDate(historyDate)}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
              </div>

              {historyError && (
                <div className="flex items-center gap-2 p-3 bg-destructive text-destructive-foreground rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span>{historyError}</span>
                </div>
              )}

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading registrations...</span>
                </div>
              ) : historyAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No registrations found for {format(new Date(historyDate), 'dd MMM yyyy')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>OP Number</TableHead>
                      <TableHead>MR Number</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{apt.token_number || '-'}</TableCell>
                        <TableCell>{apt.appointment_time || '-'}</TableCell>
                        <TableCell className="font-mono">{apt.op_number || '-'}</TableCell>
                        <TableCell className="font-mono">{apt.patient_mr_number}</TableCell>
                        <TableCell className="font-medium">{apt.patient_name}</TableCell>
                        <TableCell>{apt.doctor_name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            apt.status === 'in-progress' || apt.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {apt.status === 'in_progress' ? 'In Progress' :
                             apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
