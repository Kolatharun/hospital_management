import { useState, useEffect, useCallback, useRef } from 'react';
import billingService, { Bill as ApiBill } from '@/services/billingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calendar, Printer, MessageSquare, Mail, Eye, Send, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import logo from '@/assets/logo.jpeg';

interface LabItem {
  name: string;
  amount: number;
}

interface Bill {
  id: string;
  billNumber: string;
  patientName: string;
  mrNumber: string;
  mobileNo: string;
  patientEmail: string;
  doctorName: string;
  consultationFee: number;
  labItems: LabItem[];
  labTotal: number;
  otherCharges: string;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentReference: string;
  createdAt: string;
}

function mapApiBillToBill(apiBill: ApiBill): Bill {
  // Parse lab items from lab_and_investigations JSON or line_items
  let labItems: LabItem[] = [];
  if (apiBill.lab_and_investigations) {
    try {
      labItems = JSON.parse(apiBill.lab_and_investigations);
    } catch {
      labItems = [];
    }
  } else if (apiBill.line_items) {
    labItems = apiBill.line_items
      .filter(item => item.item_type === 'lab')
      .map(item => ({ name: item.item_name, amount: item.amount }));
  }

  return {
    id: apiBill.id,
    billNumber: apiBill.bill_number,
    patientName: apiBill.patient_name,
    mrNumber: apiBill.uhid || '',
    mobileNo: apiBill.mobile_no || '',
    patientEmail: apiBill.patient_email || '',
    doctorName: apiBill.doctor_name || '',
    consultationFee: apiBill.consultation_fee || 0,
    labItems,
    labTotal: apiBill.lab_total || labItems.reduce((sum, item) => sum + item.amount, 0),
    otherCharges: apiBill.other_charges || '',
    discountAmount: apiBill.discount_amount || 0,
    discountPercent: apiBill.discount_percent || 0,
    totalAmount: apiBill.total_amount,
    paidAmount: apiBill.paid_amount,
    dueAmount: apiBill.due_amount,
    paymentStatus: apiBill.payment_status as 'pending' | 'partial' | 'paid',
    paymentMethod: (apiBill.payment_method || 'cash') as 'cash' | 'card' | 'upi',
    paymentReference: apiBill.payment_reference || '',
    createdAt: apiBill.created_at,
  };
}

export function BillsList() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [shareDialog, setShareDialog] = useState<{ bill: Bill; type: 'whatsapp' | 'email' } | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const [error, setError] = useState<string | null>(null);

  // Fetch bills from backend based on selected date and search query
  const fetchBills = useCallback(async (date: string, query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBills = await billingService.search({
        from_date: date,
        to_date: date,
        query: query || undefined,
        limit: 100,
      });
      setBills(apiBills.map(mapApiBillToBill));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load bills. Please try again.';
      setError(message);
      toast({
        title: 'Error loading bills',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Refetch when date changes
  useEffect(() => {
    fetchBills(selectedDate, searchQuery);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBills(selectedDate, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  // Bills are already filtered by backend, use directly
  const filteredBills = bills;

  const getPaymentStatusBadge = (status: Bill['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30 font-bold">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-warning/20 text-warning border-warning/30 font-bold">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-bold">Pending</Badge>;
      default:
        return null;
    }
  };

  const handlePrint = (bill: Bill) => {
    // Safe number formatting helper
    const formatAmount = (amount: number | undefined | null): string => {
      const num = Number(amount) || 0;
      return num.toFixed(2);
    };

    // Safe date formatting helper
    const formatDate = (dateStr: string): string => {
      try {
        return format(new Date(dateStr), 'dd-MM-yyyy');
      } catch {
        return '-';
      }
    };

    const formatTime = (dateStr: string): string => {
      try {
        return format(new Date(dateStr), 'hh:mm a');
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
    const labTotal = Number(bill.labTotal) || 0;
    const labItems = bill.labItems || [];
    const otherChargesText = bill.otherCharges || '';
    const otherChargesNums = otherChargesText.match(/\d+/g);
    const otherChargesTotal = otherChargesNums ? otherChargesNums.reduce((sum: number, n: string) => sum + parseInt(n), 0) : 0;
    const totalAmount = Number(bill.totalAmount) || 0;
    const paidAmount = Number(bill.paidAmount) || 0;
    const dueAmount = Number(bill.dueAmount) || 0;
    const discountAmount = Number(bill.discountAmount) || 0;
    const discountPercent = Number(bill.discountPercent) || 0;
    const preDiscountTotal = consultationFee + labTotal + otherChargesTotal;
    const paymentMethod = bill.paymentMethod || 'cash';

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

    // Add other charges as a line item
    if (otherChargesTotal > 0) {
      lineItemsRows.push(
        '<tr>' +
        '<td>' + slNo++ + '</td>' +
        '<td>Other Charges' + (otherChargesText ? ' (' + otherChargesText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + ')' : '') + '</td>' +
        '<td style="text-align: center;">1</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(otherChargesTotal) + '</td>' +
        '<td style="text-align: right;">₹ ' + formatAmount(otherChargesTotal) + '</td>' +
        '</tr>'
      );
    }

    const lineItemsHtml = lineItemsRows.join('');

    // Build discount row if applicable
    const discountRow = discountAmount > 0
      ? '<p style="color: #22c55e;">DISCOUNT (' + discountPercent + '%): -₹ ' + formatAmount(discountAmount) + '</p>'
      : '';

    // Build payment reference row if applicable
    const paymentRefRow = bill.paymentReference
      ? '<p><span class="label">REF/TXN ID:</span> ' + bill.paymentReference + '</p>'
      : '';

    const paymentRefRowInfo = bill.paymentReference
      ? '<p><span class="label">TXN ID:</span> ' + bill.paymentReference + '</p>'
      : '';

    // Use base64 logo if available
    const logoSrc = logoBase64Ref.current || '';
    const logoHtml = logoSrc
      ? '<img src="' + logoSrc + '" alt="Balaji Heart Center" class="logo" />'
      : '';

    // Build the complete HTML content
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
      '.bill-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }' +
      '.bill-info p { margin: 5px 0; }' +
      '.label { color: #a63d40; font-weight: bold; }' +
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
      '<div>' +
      '<p><span class="label">BILL NO:</span> ' + (bill.billNumber || '-') + '</p>' +
      '<p><span class="label">MR NO:</span> ' + (bill.mrNumber || '-') + '</p>' +
      '<p><span class="label">PATIENT:</span> ' + (bill.patientName || '-') + '</p>' +
      '<p><span class="label">MOBILE:</span> ' + (bill.mobileNo || '-') + '</p>' +
      '</div>' +
      '<div style="text-align: right;">' +
      '<p><span class="label">DATE:</span> ' + formatDate(bill.createdAt) + '</p>' +
      '<p><span class="label">TIME:</span> ' + formatTime(bill.createdAt) + '</p>' +
      '<p><span class="label">DOCTOR:</span> ' + (bill.doctorName || '-') + '</p>' +
      paymentRefRowInfo +
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
      '<p><span class="label">PAY MODE:</span> ' + paymentMethod.toUpperCase() + '</p>' +
      '<p><span class="label">PAID AMOUNT:</span> ₹ ' + formatAmount(paidAmount) + '</p>' +
      paymentRefRow +
      '</div>' +
      '<div class="payment-right">' +
      '<p>Consultation: ₹ ' + formatAmount(consultationFee) + '</p>' +
      '<p>Lab Total: ₹ ' + formatAmount(labTotal) + '</p>' +
      (otherChargesTotal > 0 ? '<p>Other Charges: ₹ ' + formatAmount(otherChargesTotal) + '</p>' : '') +
      '<p class="total-row">TOTAL AMOUNT: ₹ ' + formatAmount(preDiscountTotal) + '</p>' +
      discountRow +
      '<p style="font-size: 16px; font-weight: bold; color: #0d7377;">NET AMOUNT: ₹ ' + formatAmount(totalAmount) + '</p>' +
      '<p class="total-row" style="color: #a63d40;">DUE: ₹ ' + formatAmount(dueAmount) + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="amount-words">' +
      '<p>RECEIVED WITH THANKS A SUM OF ₹ ' + formatAmount(paidAmount) + ' ONLY</p>' +
      '<p>AMOUNT IN WORDS: ' + numberToWords(paidAmount) + ' RUPEES ONLY</p>' +
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
        title: 'Print Error',
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

  const handleWhatsAppShare = async (bill: Bill) => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await billingService.sendWhatsApp(bill.id, phoneNumber);
      toast({
        title: 'WhatsApp Sent',
        description: 'Bill receipt PDF sent successfully via WhatsApp.',
      });
      setShareDialog(null);
      setPhoneNumber('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send WhatsApp';
      toast({
        title: 'WhatsApp Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailShare = async (bill: Bill) => {
    if (!emailAddress) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await billingService.sendEmail(bill.id, emailAddress);
      toast({
        title: 'Email Sent',
        description: `Bill receipt PDF sent successfully to ${emailAddress}.`,
      });
      setShareDialog(null);
      setEmailAddress('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      toast({
        title: 'Email Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Bills</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, bill#, MR#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {isToday && (
            <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">
              Today's Bills
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-primary">{filteredBills.length}</p>
            <p className="text-sm text-muted-foreground">Total Bills</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-success">
              {filteredBills.filter(b => b.paymentStatus === 'paid').length}
            </p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-warning">
              {filteredBills.filter(b => b.paymentStatus === 'partial').length}
            </p>
            <p className="text-sm text-muted-foreground">Partial</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-destructive">
              {filteredBills.filter(b => b.paymentStatus === 'pending').length}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Bills for {isToday ? 'Today' : format(new Date(selectedDate), 'dd MMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p>Loading bills for {isToday ? 'today' : format(new Date(selectedDate), 'dd MMM yyyy')}...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive font-medium mb-2">Unable to load bills</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchBills(selectedDate, searchQuery)}>
                Retry
              </Button>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No bills found</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? `No bills matching "${searchQuery}" on ${format(new Date(selectedDate), 'dd MMM yyyy')}`
                  : `No bills were generated on ${isToday ? 'today' : format(new Date(selectedDate), 'dd MMM yyyy')}`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead className="font-bold text-primary">Bill No</TableHead>
                    <TableHead className="font-bold text-primary">Patient</TableHead>
                    <TableHead className="font-bold text-primary">MR Number</TableHead>
                    <TableHead className="font-bold text-primary">Doctor</TableHead>
                    <TableHead className="font-bold text-primary">Amount</TableHead>
                    <TableHead className="font-bold text-primary">Status</TableHead>
                    <TableHead className="font-bold text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                      <TableCell className="font-medium">{bill.patientName}</TableCell>
                      <TableCell className="font-mono text-sm">{bill.mrNumber}</TableCell>
                      <TableCell>{bill.doctorName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">₹{bill.totalAmount}</p>
                          {bill.dueAmount > 0 && (
                            <p className="text-xs text-destructive">Due: ₹{bill.dueAmount}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(bill.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewBill(bill)}
                            title="View"
                            className="hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(bill)}
                            title="Print"
                            className="hover:bg-primary/10"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => { setPhoneNumber(bill.mobileNo); setShareDialog({ bill, type: 'whatsapp' }); }}
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => { setEmailAddress(bill.patientEmail); setShareDialog({ bill, type: 'email' }); }}
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
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

      {/* View Bill Dialog */}
      <Dialog open={!!viewBill} onOpenChange={() => setViewBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>View bill information</DialogDescription>
          </DialogHeader>
          {viewBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill Number</p>
                  <p className="font-semibold">{viewBill.billNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">{format(new Date(viewBill.createdAt), 'dd-MM-yyyy hh:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-semibold">{viewBill.patientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MR Number</p>
                  <p className="font-semibold">{viewBill.mrNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-semibold">{viewBill.doctorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-semibold capitalize">{viewBill.paymentMethod}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-semibold">₹{viewBill.totalAmount}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Paid Amount</span>
                  <span className="font-semibold">₹{viewBill.paidAmount}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Due Amount</span>
                  <span className="font-semibold">₹{viewBill.dueAmount}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handlePrint(viewBill)} className="flex-1 gap-2 font-bold">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhoneNumber(viewBill.mobileNo);
                    setViewBill(null);
                    setShareDialog({ bill: viewBill, type: 'whatsapp' });
                  }}
                  className="gap-2 font-bold"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailAddress(viewBill.patientEmail);
                    setViewBill(null);
                    setShareDialog({ bill: viewBill, type: 'email' });
                  }}
                  className="gap-2 font-bold"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareDialog} onOpenChange={() => { setShareDialog(null); setEmailAddress(''); setPhoneNumber(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {shareDialog?.type === 'whatsapp' ? 'Send via WhatsApp' : 'Send via Email'}
            </DialogTitle>
            <DialogDescription>
              Share bill details with patient
            </DialogDescription>
          </DialogHeader>
          {shareDialog && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{shareDialog.bill.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {shareDialog.bill.billNumber} • ₹{shareDialog.bill.totalAmount}
                </p>
              </div>

              {shareDialog.type === 'whatsapp' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              )}

              {shareDialog.type === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="patient@email.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={() => shareDialog.type === 'whatsapp'
                  ? handleWhatsAppShare(shareDialog.bill)
                  : handleEmailShare(shareDialog.bill)
                }
                className="w-full gap-2 font-bold"
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending
                  ? 'Sending...'
                  : shareDialog.type === 'whatsapp'
                    ? 'Send via WhatsApp'
                    : 'Send Email'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
