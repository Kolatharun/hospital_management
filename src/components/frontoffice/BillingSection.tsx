import { useState, useEffect, useCallback, useRef } from 'react';
import { useClinicData, Appointment } from '@/contexts/ClinicDataContext';
import billingService, { Bill as ApiBill, BillCreate, BillLineItem, BillUpdate } from '@/services/billingService';
import prescriptionService from '@/services/prescriptionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Receipt, Printer, CreditCard, Banknote, Search, RotateCcw, Save, Plus, Trash2, FlaskConical, Pencil, X, AlertCircle } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  uhid: string;
  gender: string;
  age: string;
  doctorName: string;
  speciality: string;
  mobileNo: string;
  patientType: string;
  consultationFee: number;
  labItems: { name: string; amount: number }[];
  otherCharges: string;
  discount: number;
  discountPercent: number;
  discountGivenBy: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentReference: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  createdAt: string;
  billNumber: string;
  tokenNumber?: string;
}

function mapApiBillToBill(apiBill: ApiBill): Bill {
  return {
    id: apiBill.id,
    appointmentId: apiBill.appointment_id || '',
    patientId: apiBill.patient_id,
    patientName: apiBill.patient_name,
    mrNumber: apiBill.uhid || '',
    uhid: apiBill.uhid || '',
    gender: apiBill.patient_gender || '',
    age: apiBill.patient_age || '',
    doctorName: apiBill.doctor_name || '',
    speciality: apiBill.speciality || '',
    mobileNo: apiBill.mobile_no || '',
    patientType: apiBill.patient_type || 'New',
    consultationFee: apiBill.consultation_fee,
    labItems: apiBill.line_items.map(item => ({ name: item.item_name, amount: item.amount })),
    otherCharges: apiBill.other_charges || '',
    discount: apiBill.discount_amount,
    discountPercent: apiBill.discount_percent,
    discountGivenBy: apiBill.discount_given_by || '',
    totalAmount: apiBill.total_amount,
    paidAmount: apiBill.paid_amount,
    dueAmount: apiBill.due_amount,
    paymentMethod: (apiBill.payment_method || 'cash') as 'cash' | 'card' | 'upi',
    paymentReference: apiBill.payment_reference || '',
    insuranceProvider: apiBill.insurance_provider || '',
    insurancePolicyNumber: apiBill.insurance_policy_number || '',
    paymentStatus: apiBill.payment_status as 'pending' | 'partial' | 'paid',
    createdAt: apiBill.created_at,
    billNumber: apiBill.bill_number,
    tokenNumber: apiBill.token_number,
  };
}

interface LabItem {
  name: string;
  amount: number;
}

const CONSULTATION_FEES: Record<string, number> = {
  'General Medicine': 300,
  'Cardiology': 500,
  'Orthopedics': 400,
  'Pediatrics': 350,
  'Dermatology': 400,
  'ENT': 350,
  'Ophthalmology': 400,
  'Gynecology': 450,
  'Neurology': 600,
  'Gastroenterology': 500,
};

export function BillingSection() {
  const { getTodayAppointments } = useClinicData();
  const { toast } = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(true);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState<Bill | null>(null);

  // Edit mode state
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [previouslyPaidAmount, setPreviouslyPaidAmount] = useState(0); // Track what was already paid before editing

  // Search in Today's Bills
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [searchedBills, setSearchedBills] = useState<Bill[]>([]);
  const [isSearchingBills, setIsSearchingBills] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [labItems, setLabItems] = useState<LabItem[]>([]);
  const [newLabName, setNewLabName] = useState('');
  const [newLabAmount, setNewLabAmount] = useState('');
  const [prescriptionLabTests, setPrescriptionLabTests] = useState<string[]>([]);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  // Store logo as base64 for print window
  const logoBase64Ref = useRef<string>('');

  // Convert logo to base64 on mount for print functionality
  useEffect(() => {
    const convertLogoToBase64 = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          logoBase64Ref.current = reader.result as string;
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to convert logo to base64:', error);
      }
    };
    convertLogoToBase64();
  }, []);

  // Fetch today's bills from backend
  const fetchBills = useCallback(async () => {
    try {
      const apiBills = await billingService.getTodayBills();
      setBills(apiBills.map(mapApiBillToBill));
    } catch {
      console.error('Failed to fetch bills');
    } finally {
      setIsLoadingBills(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const [billingForm, setBillingForm] = useState({
    consultationFee: 0,
    otherCharges: '',
    discount: 0,
    discountPercent: 0,
    discountGivenBy: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'upi',
    paymentReference: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    paidAmount: 0,
  });

  const todayAppointments = getTodayAppointments();
  const unbilledAppointments = todayAppointments.filter(
    apt => !bills.find(b => b.appointmentId === apt.id)
  );

  const filteredAppointments = unbilledAppointments.filter(
    apt =>
      apt.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient.mrNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate lab total - ensure numeric
  const labTotal = labItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // Parse other charges
  const parseOtherCharges = (text: string): number => {
    const numbers = text.match(/\d+/g);
    if (!numbers) return 0;
    return numbers.reduce((sum, n) => sum + parseInt(n), 0);
  };
  const otherChargesTotal = parseOtherCharges(billingForm.otherCharges);

  // Ensure all values are numbers for calculations
  const consultationFeeNum = Number(billingForm.consultationFee) || 0;
  const discountNum = Number(billingForm.discount) || 0;
  const discountPercentNum = Number(billingForm.discountPercent) || 0;
  const paidAmountNum = Number(billingForm.paidAmount) || 0;

  const preDiscountTotal = consultationFeeNum + labTotal + otherChargesTotal;
  const discountAmount = discountPercentNum > 0
    ? Math.round(preDiscountTotal * discountPercentNum / 100)
    : discountNum;
  const totalAmount = preDiscountTotal - discountAmount;

  // For edit mode: calculate what's still due considering previous payments
  // For create mode: calculate due based on current payment
  const totalPaidSoFar = editingBill ? previouslyPaidAmount + paidAmountNum : paidAmountNum;
  const dueAmount = totalAmount - totalPaidSoFar;
  const newAmountDue = editingBill ? totalAmount - previouslyPaidAmount : totalAmount; // Amount due before current payment

  const handleSelectPatient = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const fee = CONSULTATION_FEES['Cardiology'] || 500;
    setBillingForm({
      consultationFee: fee,
      otherCharges: '',
      discount: 0,
      discountPercent: 0,
      discountGivenBy: '',
      paymentMethod: 'cash',
      paymentReference: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      paidAmount: fee,
    });
    setLabItems([]);
    setPrescriptionLabTests([]);

    toast({
      description: `Creating bill for ${appointment.patient.firstName} ${appointment.patient.lastName}`,
    });

    // Fetch prescription lab tests for auto-population
    setIsLoadingPrescription(true);
    try {
      const prescription = await prescriptionService.getByAppointment(appointment.id);
      if (prescription && prescription.lab_tests) {
        // Parse lab_tests - could be comma-separated or newline-separated
        const tests = prescription.lab_tests
          .split(/[,\n]/)
          .map(test => test.trim())
          .filter(test => test.length > 0);
        setPrescriptionLabTests(tests);
      }
    } catch {
      // No prescription found - that's okay
      console.log('No prescription found for this appointment');
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  const handleAddLabItem = () => {
    // Check if patient is selected
    if (!selectedAppointment && !editingBill) {
      toast({
        description: 'Please select a patient first before adding lab tests.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedName = newLabName.trim();
    const amount = parseInt(newLabAmount);

    if (!trimmedName) {
      toast({
        description: 'Please enter a lab test name.',
        variant: 'destructive',
      });
      return;
    }

    if (!newLabAmount || isNaN(amount) || amount <= 0) {
      toast({
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate lab item
    const isDuplicate = labItems.some(
      (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      toast({
        description: `"${trimmedName}" is already added to the bill.`,
        variant: 'destructive',
      });
      return;
    }

    setLabItems([...labItems, { name: trimmedName, amount }]);
    setNewLabName('');
    setNewLabAmount('');

    toast({
      description: `${trimmedName} - ₹${amount} added successfully.`,
    });
  };

  const handleRemoveLabItem = (index: number) => {
    const removedItem = labItems[index];
    setLabItems(labItems.filter((_, i) => i !== index));
    toast({
      description: `${removedItem.name} removed from bill.`,
    });
  };

  const generateBillNumber = () => {
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `BILL-${random}`;
  };

  const generateUHID = () => {
    return crypto.randomUUID().slice(0, 6);
  };

  // Create a preview bill object without saving
  const createPreviewBill = (): Bill => {
    if (!selectedAppointment) throw new Error('No appointment selected');
    return {
      id: 'preview',
      appointmentId: selectedAppointment.id,
      patientId: selectedAppointment.patientId,
      patientName: `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`,
      mrNumber: selectedAppointment.patient.mrNumber,
      uhid: generateUHID(),
      gender: selectedAppointment.patient.gender,
      age: selectedAppointment.patient.dateOfBirth 
        ? String(new Date().getFullYear() - new Date(selectedAppointment.patient.dateOfBirth).getFullYear())
        : '-',
      doctorName: selectedAppointment.doctorName,
      speciality: 'Cardiology',
      mobileNo: selectedAppointment.patient.phone,
      patientType: 'New',
      consultationFee: billingForm.consultationFee,
      labItems,
      otherCharges: billingForm.otherCharges,
      discount: discountAmount,
      discountPercent: billingForm.discountPercent,
      discountGivenBy: billingForm.discountGivenBy,
      totalAmount,
      paidAmount: billingForm.paidAmount,
      dueAmount,
      paymentMethod: billingForm.paymentMethod,
      paymentReference: billingForm.paymentReference,
      insuranceProvider: billingForm.insuranceProvider,
      insurancePolicyNumber: billingForm.insurancePolicyNumber,
      paymentStatus:
        billingForm.paidAmount >= totalAmount
          ? 'paid'
          : billingForm.paidAmount > 0
          ? 'partial'
          : 'pending',
      createdAt: new Date().toISOString(),
      billNumber: 'PREVIEW',
    };
  };

  const generateOPNumber = () => {
    if (!selectedAppointment) return '';
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const index = todayAppointments.indexOf(selectedAppointment) + 1;
    return `OP-${date}-${String(index).padStart(3, '0')}`;
  };

  const handleReset = () => {
    if (!selectedAppointment) return;
    const fee = CONSULTATION_FEES['Cardiology'] || 500;
    setBillingForm({
      consultationFee: fee,
      otherCharges: '',
      discount: 0,
      discountPercent: 0,
      discountGivenBy: '',
      paymentMethod: 'cash',
      paymentReference: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      paidAmount: fee,
    });
    setLabItems([]);
    // Don't clear prescriptionLabTests - keep them visible for reference

    toast({
      description: 'Billing form has been reset to defaults.',
    });
  };

  // Validate billing form before submission
  const validateBillingForm = (): boolean => {
    // Validate consultation fee
    if (consultationFeeNum <= 0 && labItems.length === 0) {
      toast({
        description: 'Please enter a consultation fee or add at least one lab item.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate discount given by when discount is applied
    if ((discountPercentNum > 0 || discountNum > 0) && !billingForm.discountGivenBy.trim()) {
      toast({
        description: 'Discount Given By is required when applying a discount.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate payment reference for card/upi payments
    if (
      (billingForm.paymentMethod === 'card' || billingForm.paymentMethod === 'upi') &&
      paidAmountNum > 0 &&
      !billingForm.paymentReference.trim()
    ) {
      toast({
        description: `Transaction reference is required for ${billingForm.paymentMethod.toUpperCase()} payment.`,
        variant: 'destructive',
      });
      return false;
    }

    // Validate paid amount does not exceed total
    if (paidAmountNum > totalAmount) {
      toast({
        description: 'Paid amount cannot exceed the total amount.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate paid amount is not negative
    if (paidAmountNum < 0) {
      toast({
        description: 'Paid amount cannot be negative.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate insurance policy number when insurance provider is entered
    if (billingForm.insuranceProvider.trim() && !billingForm.insurancePolicyNumber.trim()) {
      toast({
        description: 'Insurance policy number is required.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleCreateBill = async (andPrint: boolean = false) => {
    if (!selectedAppointment) return;

    // Validate form before creating bill
    if (!validateBillingForm()) {
      return;
    }

    setIsCreatingBill(true);

    try {
      const lineItems: Omit<BillLineItem, 'id'>[] = labItems.map(item => ({
        item_name: item.name,
        item_type: 'lab',
        quantity: 1,
        unit_price: Number(item.amount),
        amount: Number(item.amount),
      }));

      const createData: BillCreate = {
        patient_id: selectedAppointment.patientId,
        appointment_id: selectedAppointment.id,
        consultation_fee: consultationFeeNum,
        other_charges: billingForm.otherCharges || undefined,
        discount_amount: discountAmount,
        discount_percent: discountPercentNum,
        discount_given_by: billingForm.discountGivenBy || undefined,
        insurance_provider: billingForm.insuranceProvider || undefined,
        insurance_policy_number: billingForm.insurancePolicyNumber || undefined,
        line_items: lineItems,
        paid_amount: paidAmountNum,
        payment_method: billingForm.paymentMethod,
        payment_reference: billingForm.paymentReference || undefined,
      };

      const apiBill = await billingService.create(createData);
      const newBill = mapApiBillToBill(apiBill);

      setBills(prev => [...prev, newBill]);

      if (andPrint) {
        printReceipt(newBill);
      } else {
        setShowReceipt(newBill);
      }

      setSelectedAppointment(null);
      setLabItems([]);

      toast({
        description: `Bill ${newBill.billNumber} generated successfully.`,
      });
    } catch {
      toast({
        description: 'Failed to create bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBill(false);
    }
  };

  // Handle editing an existing bill
  const handleEditBill = async (bill: Bill) => {
    setEditingBill(bill);
    setSelectedAppointment(null);

    // Track what was previously paid - this is read-only reference
    setPreviouslyPaidAmount(Number(bill.paidAmount) || 0);

    // Populate form with existing bill data
    // paidAmount is set to 0 - user will enter NEW/ADDITIONAL payment amount
    setBillingForm({
      consultationFee: Number(bill.consultationFee) || 0,
      otherCharges: bill.otherCharges || '',
      discount: Number(bill.discount) || 0,
      discountPercent: Number(bill.discountPercent) || 0,
      discountGivenBy: bill.discountGivenBy || '',
      paymentMethod: bill.paymentMethod,
      paymentReference: bill.paymentReference || '',
      insuranceProvider: bill.insuranceProvider || '',
      insurancePolicyNumber: bill.insurancePolicyNumber || '',
      paidAmount: 0, // Start with 0 - user enters additional payment
    });

    // Populate existing lab items
    setLabItems(bill.labItems.map(item => ({ name: item.name, amount: item.amount })));

    toast({
      description: `Now editing bill ${bill.billNumber} for ${bill.patientName}.`,
    });

    // Fetch prescription lab tests for this bill's appointment
    if (bill.appointmentId) {
      setIsLoadingPrescription(true);
      try {
        const prescription = await prescriptionService.getByAppointment(bill.appointmentId);
        if (prescription && prescription.lab_tests) {
          const tests = prescription.lab_tests
            .split(/[,\n]/)
            .map(test => test.trim())
            .filter(test => test.length > 0);
          setPrescriptionLabTests(tests);
        } else {
          setPrescriptionLabTests([]);
        }
      } catch {
        console.log('No prescription found for this appointment');
        setPrescriptionLabTests([]);
      } finally {
        setIsLoadingPrescription(false);
      }
    }
  };

  // Validate billing form for update (considers previous payments)
  const validateUpdateForm = (): boolean => {
    // Validate consultation fee or lab items exist
    if (consultationFeeNum <= 0 && labItems.length === 0) {
      toast({
        description: 'Please enter a consultation fee or add at least one lab item.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate discount given by when discount is applied
    if ((discountPercentNum > 0 || discountNum > 0) && !billingForm.discountGivenBy.trim()) {
      toast({
        description: 'Discount Given By is required when applying a discount.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate payment reference for card/upi payments (only if making new payment)
    if (
      (billingForm.paymentMethod === 'card' || billingForm.paymentMethod === 'upi') &&
      paidAmountNum > 0 &&
      !billingForm.paymentReference.trim()
    ) {
      toast({
        description: `Transaction reference is required for ${billingForm.paymentMethod.toUpperCase()} payment.`,
        variant: 'destructive',
      });
      return false;
    }

    // Validate total paid does not exceed total amount
    if (totalPaidSoFar > totalAmount) {
      toast({
        description: 'Total paid amount cannot exceed the bill total.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate additional payment is not negative
    if (paidAmountNum < 0) {
      toast({
        description: 'Additional payment cannot be negative.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate insurance policy number when insurance provider is entered
    if (billingForm.insuranceProvider.trim() && !billingForm.insurancePolicyNumber.trim()) {
      toast({
        description: 'Insurance policy number is required.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Handle updating an existing bill
  const handleUpdateBill = async (andPrint: boolean = false) => {
    if (!editingBill) return;

    // Validate form before updating bill
    if (!validateUpdateForm()) {
      return;
    }

    setIsUpdatingBill(true);

    try {
      const lineItems: Omit<BillLineItem, 'id'>[] = labItems.map(item => ({
        item_name: item.name,
        item_type: 'lab',
        quantity: 1,
        unit_price: Number(item.amount),
        amount: Number(item.amount),
      }));

      // Calculate total paid = previously paid + new payment
      const totalPaidAmount = previouslyPaidAmount + paidAmountNum;

      const updateData: BillUpdate = {
        consultation_fee: consultationFeeNum,
        other_charges: billingForm.otherCharges || undefined,
        discount_amount: discountAmount,
        discount_percent: discountPercentNum,
        discount_given_by: billingForm.discountGivenBy || undefined,
        insurance_provider: billingForm.insuranceProvider || undefined,
        insurance_policy_number: billingForm.insurancePolicyNumber || undefined,
        line_items: lineItems,
        paid_amount: totalPaidAmount, // Send total paid (previous + new)
        payment_method: billingForm.paymentMethod,
        payment_reference: billingForm.paymentReference || undefined,
      };

      const apiBill = await billingService.update(editingBill.id, updateData);
      const updatedBill = mapApiBillToBill(apiBill);

      // Update bills list
      setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));

      // Also update search results if showing
      if (showSearchResults) {
        setSearchedBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
      }

      if (andPrint) {
        printReceipt(updatedBill);
      } else {
        setShowReceipt(updatedBill);
      }

      handleCancelEdit();

      toast({
        description: `Bill ${updatedBill.billNumber} updated successfully.`,
      });
    } catch {
      toast({
        description: 'Failed to update bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingBill(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    const billNumber = editingBill?.billNumber;
    setEditingBill(null);
    setPreviouslyPaidAmount(0);
    setLabItems([]);
    setPrescriptionLabTests([]);
    setBillingForm({
      consultationFee: 0,
      otherCharges: '',
      discount: 0,
      discountPercent: 0,
      discountGivenBy: '',
      paymentMethod: 'cash',
      paymentReference: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      paidAmount: 0,
    });

    if (billNumber) {
      toast({
        description: `Changes to bill ${billNumber} discarded.`,
      });
    }
  };

  // Search bills from backend
  const handleSearchBills = async () => {
    if (!billSearchQuery.trim()) {
      toast({
        description: 'Please enter a search term (name, MR number, or bill number).',
        variant: 'destructive',
      });
      setShowSearchResults(false);
      setSearchedBills([]);
      return;
    }

    setIsSearchingBills(true);
    try {
      const results = await billingService.search({ query: billSearchQuery.trim(), limit: 50 });
      setSearchedBills(results.map(mapApiBillToBill));
      setShowSearchResults(true);

      if (results.length === 0) {
        toast({
          description: `No bills found for "${billSearchQuery.trim()}".`,
        });
      } else {
        toast({
          description: `Found ${results.length} bill(s) matching your search.`,
        });
      }
    } catch {
      toast({
        description: 'Failed to search bills. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingBills(false);
    }
  };

  // Clear search results
  const handleClearSearch = () => {
    setBillSearchQuery('');
    setSearchedBills([]);
    setShowSearchResults(false);
    toast({
      description: 'Showing today\'s bills.',
    });
  };

  const printReceipt = (bill: Bill) => {
    // Safe number formatting helper
    const formatAmount = (amount: number | undefined | null): string => {
      const num = Number(amount) || 0;
      return num.toFixed(2);
    };

    // Safe date/time formatting helper
    const formatDateTime = (isoString: string): string => {
      try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) + ', ' + date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      } catch {
        return '-';
      }
    };

    // Number to words function
    const numberToWords = (num: number): string => {
      if (!num || num === 0) return 'ZERO';
      const n = Math.abs(Math.round(num));
      const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
      const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
      const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
      if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
      return numberToWords(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '');
    };

    // Safe values with defaults
    const consultationFee = Number(bill.consultationFee) || 0;
    const labItems = bill.labItems || [];
    const labTotal = labItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalAmount = Number(bill.totalAmount) || 0;
    const paidAmount = Number(bill.paidAmount) || 0;
    const dueAmount = Number(bill.dueAmount) || 0;
    const discount = Number(bill.discount) || 0;
    const discountPercent = Number(bill.discountPercent) || 0;
    const preDiscountTotal = consultationFee + labTotal;
    const paymentMethod = bill.paymentMethod || 'cash';

    // Use base64 logo if available
    const logoSrc = logoBase64Ref.current || '';

    // Build line items rows
    let slNo = 1;
    const lineItemsRows: string[] = [];

    if (consultationFee > 0) {
      lineItemsRows.push(
        '<tr>' +
        '<td>' + slNo++ + '</td>' +
        '<td>Consultation Fees</td>' +
        '<td style="text-align: center;">1</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(consultationFee) + '</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(consultationFee) + '</td>' +
        '</tr>'
      );
    }

    // Add lab items
    labItems.forEach((item) => {
      const itemAmount = Number(item.amount) || 0;
      lineItemsRows.push(
        '<tr>' +
        '<td>' + slNo++ + '</td>' +
        '<td>' + (item.name || 'Lab Test') + '</td>' +
        '<td style="text-align: center;">1</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(itemAmount) + '</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(itemAmount) + '</td>' +
        '</tr>'
      );
    });

    const lineItemsHtml = lineItemsRows.join('');

    // Build conditional rows
    const paymentRefRow = bill.paymentReference
      ? '<p><span class="label">REF/TXN ID</span> : ' + bill.paymentReference + '</p>'
      : '';
    const txnIdRow = bill.paymentReference
      ? '<p><span class="label">TXN ID</span> : ' + bill.paymentReference + '</p>'
      : '';
    const insuranceRow = bill.insuranceProvider
      ? '<p><span class="label">INSURANCE</span> : ' + bill.insuranceProvider + '</p>'
      : '';
    const discountRow = discount > 0
      ? '<p style="color: #22c55e;">DISCOUNT (' + discountPercent + '%): -₹ ' + formatAmount(discount) + '</p>'
      : '';

    // Build logo HTML - only include if we have base64 data
    const logoHtml = logoSrc
      ? '<img src="' + logoSrc + '" alt="Balaji Heart Center" class="logo" />'
      : '';

    // Build the complete HTML content using string concatenation
    const htmlContent = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<title>Bill Receipt - ' + (bill.billNumber || 'Receipt') + '</title>' +
      '<style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }' +
      '.header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; border-bottom: 3px solid #0d7377; padding-bottom: 15px; }' +
      '.logo { height: 60px; }' +
      '.header-text h1 { color: #0d7377; font-size: 24px; }' +
      '.header-text p { color: #666; font-size: 11px; }' +
      '.bill-title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; color: #0d7377; }' +
      '.bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }' +
      '.bill-info .left, .bill-info .right { width: 48%; }' +
      '.bill-info p { margin: 4px 0; }' +
      '.label { font-weight: bold; color: #a63d40; }' +
      'table { width: 100%; border-collapse: collapse; margin: 20px 0; }' +
      'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
      'th { background: #0d7377; color: white; }' +
      '.payment-section { display: flex; justify-content: space-between; margin-top: 20px; }' +
      '.payment-left { width: 45%; }' +
      '.payment-right { width: 45%; text-align: right; }' +
      '.payment-right p { margin: 4px 0; }' +
      '.total-row { font-weight: bold; font-size: 14px; }' +
      '.amount-words { margin: 20px 0; padding: 10px; background: #f0f7f7; border-left: 4px solid #0d7377; }' +
      '.signature { text-align: right; margin-top: 40px; padding-top: 20px; }' +
      '.signature-line { border-top: 1px solid #000; width: 200px; margin-left: auto; padding-top: 5px; }' +
      '.footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #0d7377; color: #666; font-size: 11px; }' +
      '@media print { body { padding: 0; } }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class="header">' +
      logoHtml +
      '<div class="header-text">' +
      '<h1>BALAJI HEART CENTER</h1>' +
      '<p style="color: #a63d40; font-weight: bold;">YES, THE \'ADVANTAGE\' HEART CLINIC!</p>' +
      '<p>SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>' +
      '<p>Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>' +
      '</div>' +
      '</div>' +
      '<div class="bill-title">BILL RECEIPT</div>' +
      '<div class="bill-info">' +
      '<div class="left">' +
      '<p><span class="label">UHID</span> : ' + (bill.uhid || '-') + '</p>' +
      '<p><span class="label">MR NO</span> : ' + (bill.mrNumber || '-') + '</p>' +
      '<p><span class="label">OP NO</span> : ' + (bill.tokenNumber || generateOPNumber() || '-') + '</p>' +
      '<p><span class="label">PATIENT NAME</span> : ' + (bill.patientName || '-') + '</p>' +
      '<p><span class="label">SEX / AGE</span> : ' + (bill.gender || '-') + ' / ' + (bill.age || '-') + '</p>' +
      '<p><span class="label">DOCTOR NAME</span> : ' + (bill.doctorName || '-') + '</p>' +
      '</div>' +
      '<div class="right" style="text-align: right;">' +
      '<p><span class="label">BILL NO</span> : ' + (bill.billNumber || '-') + '</p>' +
      '<p><span class="label">BILL DT & TM</span> : ' + formatDateTime(bill.createdAt) + '</p>' +
      '<p><span class="label">MOBILE NO</span> : ' + (bill.mobileNo || '-') + '</p>' +
      '<p><span class="label">TYPE</span> : ' + (bill.patientType || 'New') + '</p>' +
      txnIdRow +
      insuranceRow +
      '</div>' +
      '</div>' +
      '<table>' +
      '<thead>' +
      '<tr>' +
      '<th style="width: 60px;">SL NO</th>' +
      '<th>SERVICE NAME</th>' +
      '<th style="width: 80px; text-align: center;">QTY</th>' +
      '<th style="width: 100px; text-align: right;">RATE</th>' +
      '<th style="width: 120px; text-align: right;">NET AMOUNT</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      lineItemsHtml +
      '</tbody>' +
      '</table>' +
      '<div class="payment-section">' +
      '<div class="payment-left">' +
      '<p><span class="label">PAYMENT DETAILS</span></p>' +
      '<p><span class="label">PAY MODE</span> : ' + paymentMethod.toUpperCase() + '</p>' +
      '<p><span class="label">PAID AMOUNT</span> : ₹ ' + formatAmount(paidAmount) + '</p>' +
      paymentRefRow +
      '</div>' +
      '<div class="payment-right">' +
      '<p>Consultation: ₹ ' + formatAmount(consultationFee) + '</p>' +
      '<p>Lab Total: ₹ ' + formatAmount(labTotal) + '</p>' +
      '<p class="total-row">TOTAL AMOUNT : ₹ ' + formatAmount(preDiscountTotal) + '</p>' +
      discountRow +
      '<p style="font-size: 16px; font-weight: bold; color: #0d7377;">NET AMOUNT : ₹ ' + formatAmount(totalAmount) + '</p>' +
      '<p class="total-row" style="color: #a63d40;">DUE : ₹ ' + formatAmount(dueAmount) + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="amount-words">' +
      '<p>RECEIVED WITH THANKS A SUM OF ₹ ' + formatAmount(paidAmount) + ' ONLY</p>' +
      '<p>AMOUNT IN WORDS : ' + numberToWords(paidAmount) + ' RUPEES ONLY</p>' +
      '</div>' +
      '<div class="signature">' +
      '<div class="signature-line">Authorised Signatory</div>' +
      '</div>' +
      '<div class="footer">' +
      '<p>Thank you for visiting Balaji Heart Center</p>' +
      '<p>For Appointments: +91 9100079990 / 9010278278 / 040-2303 2345</p>' +
      '<p>www.balajiheartcenter.com</p>' +
      '</div>' +
      '</body>' +
      '</html>';

    // Open print window and write content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        description: 'Unable to open print window. Please check your popup blocker settings.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load (especially the logo image) before printing
    const logoImg = printWindow.document.querySelector('.logo') as HTMLImageElement;
    if (logoImg && !logoImg.complete) {
      logoImg.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      logoImg.onerror = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      // Fallback with timeout
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        }
      }, 300);
    }
  };

  const getPaymentStatusBadge = (status: Bill['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center gap-2">
        <IndianRupee className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Billing & Payments</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create/Edit Bill Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                {editingBill ? <Pencil className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                {editingBill ? 'Edit Bill' : 'Create Bill'}
              </span>
              {editingBill && (
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="gap-1">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedAppointment && !editingBill ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient by name or MR number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredAppointments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No unbilled patients found
                    </p>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleSelectPatient(apt)}
                      >
                        <div>
                          <p className="font-medium">
                            {apt.patient.firstName} {apt.patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apt.patient.mrNumber} • {apt.doctorName}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">Select</Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${editingBill ? 'bg-warning/5 border-warning/20' : 'bg-primary/5 border-primary/20'}`}>
                  {editingBill ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-lg">{editingBill.patientName}</p>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          Editing
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {editingBill.mrNumber} • Bill: {editingBill.billNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Previously Paid: ₹{editingBill.paidAmount} | Status: {editingBill.paymentStatus}
                      </p>
                    </>
                  ) : selectedAppointment ? (
                    <>
                      <p className="font-semibold text-lg">
                        {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.patient.mrNumber} • {generateOPNumber()}
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Consultation Fee */}
                <div className="space-y-2">
                  <Label>Consultation Fees (₹) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    value={billingForm.consultationFee === 0 ? '' : billingForm.consultationFee}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, consultationFee: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="text-lg font-semibold"
                    placeholder="0"
                  />
                </div>

                {/* Other Charges */}
                <div className="space-y-2">
                  <Label>Other Charges / Notes (manual)</Label>
                  <Textarea
                    placeholder="Enter charge descriptions and amounts (e.g., 'X-ray - 500, ECG - 300'). Numbers in this field will be summed into the total."
                    value={billingForm.otherCharges}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, otherCharges: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount (%)</Label>
                    <Select
                      value={String(billingForm.discountPercent)}
                      onValueChange={(v) => setBillingForm(prev => ({ ...prev, discountPercent: Number(v), discount: 0 }))}
                    >
                      <SelectTrigger className="border-destructive/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 5, 10, 15, 20, 25, 30].map(p => (
                          <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Discount Given By
                      {(billingForm.discountPercent > 0 || billingForm.discount > 0) && (
                        <span className="text-destructive"> *</span>
                      )}
                    </Label>
                    <Input
                      placeholder="Enter name"
                      value={billingForm.discountGivenBy}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, discountGivenBy: e.target.value }))}
                      className={(billingForm.discountPercent > 0 || billingForm.discount > 0) && !billingForm.discountGivenBy.trim() ? 'border-destructive' : ''}
                    />
                    {(billingForm.discountPercent > 0 || billingForm.discount > 0) && !billingForm.discountGivenBy.trim() && (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Discount Given By is required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Payment Method <span className="text-destructive">*</span></Label>
                  <Select
                    value={billingForm.paymentMethod}
                    onValueChange={(value: 'cash' | 'card' | 'upi') =>
                      setBillingForm(prev => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <span className="flex items-center gap-2">
                          <Banknote className="w-4 h-4" /> Cash
                        </span>
                      </SelectItem>
                      <SelectItem value="card">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Card
                        </span>
                      </SelectItem>
                      <SelectItem value="upi">
                        <span className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4" /> UPI
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Reference */}
                <div className="space-y-2">
                  <Label>
                    Payment Reference (Txn ID / UPI ID)
                    {(billingForm.paymentMethod === 'card' || billingForm.paymentMethod === 'upi') && billingForm.paidAmount > 0 && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  <Input
                    placeholder="Enter transaction ID or UPI reference"
                    value={billingForm.paymentReference}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                    className={(billingForm.paymentMethod === 'card' || billingForm.paymentMethod === 'upi') && billingForm.paidAmount > 0 && !billingForm.paymentReference.trim() ? 'border-destructive' : ''}
                  />
                  {(billingForm.paymentMethod === 'card' || billingForm.paymentMethod === 'upi') && billingForm.paidAmount > 0 && !billingForm.paymentReference.trim() && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Transaction reference is required</span>
                    </div>
                  )}
                </div>

                {/* Insurance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Insurance Provider (if applicable)</Label>
                    <Input
                      placeholder="Insurance company name"
                      value={billingForm.insuranceProvider}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Insurance Policy Number
                      {billingForm.insuranceProvider.trim() && (
                        <span className="text-destructive"> *</span>
                      )}
                    </Label>
                    <Input
                      placeholder="Policy number"
                      value={billingForm.insurancePolicyNumber}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                      className={billingForm.insuranceProvider.trim() && !billingForm.insurancePolicyNumber.trim() ? 'border-destructive' : ''}
                    />
                    {billingForm.insuranceProvider.trim() && !billingForm.insurancePolicyNumber.trim() && (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insurance policy number is required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paid Amount - shows "Additional Payment" when editing */}
                <div className="space-y-2">
                  <Label>{editingBill ? 'Additional Payment (₹)' : 'Paid Amount (₹)'}</Label>
                  <Input
                    type="number"
                    value={billingForm.paidAmount === 0 ? '' : billingForm.paidAmount}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, paidAmount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="text-lg font-semibold"
                    placeholder="0"
                  />
                  {editingBill && (
                    <p className="text-xs text-muted-foreground">
                      Enter the new payment amount being made now
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between">
                    <span>Consultation:</span>
                    <span>₹{consultationFeeNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lab Total:</span>
                    <span>₹{labTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Charges:</span>
                    <span>₹{otherChargesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Pre-discount:</span>
                    <span>₹{preDiscountTotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount ({discountPercentNum}%):</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-primary border-t pt-2">
                    <span>Grand Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>

                  {/* Edit mode: Show payment breakdown */}
                  {editingBill && (
                    <>
                      <div className="flex justify-between text-sm border-t pt-2 mt-2">
                        <span>Previously Paid:</span>
                        <span className="text-success">₹{previouslyPaidAmount.toFixed(2)}</span>
                      </div>
                      {newAmountDue > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Amount Due (before payment):</span>
                          <span className="text-warning">₹{newAmountDue.toFixed(2)}</span>
                        </div>
                      )}
                      {paidAmountNum > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Paying Now:</span>
                          <span className="text-primary">₹{paidAmountNum.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span>Total Paid (after update):</span>
                        <span className="text-success">₹{totalPaidSoFar.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {dueAmount > 0 && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex justify-between text-warning font-semibold">
                      <span>{editingBill ? 'Balance Due (after update):' : 'Due Amount:'}</span>
                      <span>₹{dueAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {dueAmount <= 0 && editingBill && totalAmount > 0 && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex justify-between text-success font-semibold">
                      <span>Status:</span>
                      <span>Fully Paid</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {editingBill ? (
                    <>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdatingBill} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => printReceipt(editingBill)}
                        disabled={isUpdatingBill}
                        className="gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Current
                      </Button>
                      <Button onClick={() => handleUpdateBill(false)} disabled={isUpdatingBill} className="gap-2 flex-1">
                        <Save className="w-4 h-4" />
                        {isUpdatingBill ? 'Updating...' : 'Update Bill'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleReset} disabled={isCreatingBill} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowReceipt({ ...createPreviewBill(), isPreview: true } as Bill & { isPreview?: boolean })}
                        disabled={isCreatingBill}
                        className="gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Preview
                      </Button>
                      <Button onClick={() => handleCreateBill(false)} disabled={isCreatingBill} className="gap-2 flex-1">
                        <Save className="w-4 h-4" />
                        {isCreatingBill ? 'Creating...' : 'Save Bill'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lab & Investigations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="w-4 h-4" />
              Lab & Investigations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prescription Lab Tests - Auto-populated from Doctor's Prescription */}
            {(selectedAppointment || editingBill) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  Lab Tests from Prescription
                </Label>
                {isLoadingPrescription ? (
                  <p className="text-sm text-muted-foreground">Loading prescription...</p>
                ) : prescriptionLabTests.length > 0 ? (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Doctor has ordered the following tests. Click to add to billing:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prescriptionLabTests.map((test, index) => {
                        const isAdded = labItems.some(item => item.name.toLowerCase() === test.toLowerCase());
                        return (
                          <Button
                            key={index}
                            variant={isAdded ? "secondary" : "outline"}
                            size="sm"
                            disabled={isAdded}
                            onClick={() => {
                              setNewLabName(test);
                              setNewLabAmount('');
                            }}
                            className="gap-1"
                          >
                            {isAdded ? '✓' : <Plus className="w-3 h-3" />}
                            {test}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                    No lab tests ordered in prescription for this appointment.
                  </p>
                )}
              </div>
            )}

            {!(selectedAppointment || editingBill) && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 text-warning border border-warning/30 rounded-md text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Please select a patient first to add lab tests</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">Add tests and amounts</p>

            <div className="flex gap-2">
              <Input
                placeholder="Test name"
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
                className="flex-1"
                disabled={!(selectedAppointment || editingBill)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newLabAmount}
                onChange={(e) => setNewLabAmount(e.target.value)}
                className="w-24"
                disabled={!(selectedAppointment || editingBill)}
              />
              <Button
                onClick={handleAddLabItem}
                size="icon"
                disabled={!(selectedAppointment || editingBill)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {labItems.length > 0 && (
              <div className="space-y-2">
                {labItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span>₹{item.amount}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveLabItem(index)}
                        className="h-6 w-6 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Subtotal (Lab):</span>
                  <span>₹{labTotal}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">Lab Billing Summary</p>
              <p className="text-sm text-muted-foreground">Totals (excluding Consultation Fee)</p>
              <p className="text-2xl font-bold mt-2">Lab Total: ₹{labTotal}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Bills */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="w-4 h-4" />
              {showSearchResults ? 'Search Results' : "Today's Bills"}
              <Badge className="ml-2">{showSearchResults ? searchedBills.length : bills.length}</Badge>
            </CardTitle>

            {/* Search Section */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, MR, bill no..."
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchBills()}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={handleSearchBills}
                disabled={isSearchingBills}
                size="sm"
                className="gap-1"
              >
                <Search className="w-4 h-4" />
                {isSearchingBills ? 'Searching...' : 'Search'}
              </Button>
              {showSearchResults && (
                <Button
                  onClick={handleClearSearch}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBills && !showSearchResults ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading bills...
            </div>
          ) : isSearchingBills ? (
            <div className="text-center py-8 text-muted-foreground">
              Searching bills...
            </div>
          ) : (showSearchResults ? searchedBills : bills).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showSearchResults ? 'No bills found matching your search' : 'No bills generated today'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showSearchResults ? searchedBills : bills).map((bill) => (
                    <TableRow key={bill.id} className={editingBill?.id === bill.id ? 'bg-warning/10' : ''}>
                      <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bill.patientName}</p>
                          <p className="text-xs text-muted-foreground">{bill.mrNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono">₹{bill.totalAmount}</p>
                          {bill.dueAmount > 0 && (
                            <p className="text-xs text-warning">Due: ₹{bill.dueAmount}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(bill.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBill(bill)}
                            disabled={editingBill?.id === bill.id}
                            className="gap-1"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => printReceipt(bill)}
                            className="gap-1"
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
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

      {/* Receipt Preview Dialog */}
      <Dialog open={!!showReceipt} onOpenChange={() => setShowReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Receipt - {showReceipt?.billNumber}</DialogTitle>
          </DialogHeader>
          {showReceipt && (
            <div className="space-y-4">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowReceipt(null)}>
                  Close
                </Button>
                <Button onClick={() => printReceipt(showReceipt)} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
