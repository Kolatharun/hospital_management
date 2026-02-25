import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Calendar, Banknote, CreditCard, Smartphone, Send, MessageSquare, Mail, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { billingService, Bill, DayPaymentSummary } from '@/services/billingService';
import { sendDaySummary } from '@/services/whatsappService';

export function DayPayments() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<DayPaymentSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialog, setShareDialog] = useState<{ type: 'whatsapp' | 'email' } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSending, setIsSending] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, billsData] = await Promise.all([
        billingService.getDaySummary(selectedDate),
        billingService.search({
          from_date: selectedDate,
          to_date: selectedDate,
          limit: 100,
        }),
      ]);
      setSummary(summaryData);
      setBills(billsData);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cashTotal = summary?.cash_amount || 0;
  const cardTotal = summary?.card_amount || 0;
  const upiTotal = summary?.upi_amount || 0;
  const grandTotal = summary?.total_paid || 0;
  const totalTransactions = summary?.total_bills || 0;

  const getPaymentMethodIcon = (method: string | undefined) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4 text-success" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-primary" />;
      case 'upi':
        return <Smartphone className="w-4 h-4 text-purple-500" />;
      default:
        return <IndianRupee className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPaymentMethodBadge = (method: string | undefined) => {
    switch (method) {
      case 'cash':
        return <Badge className="bg-success/20 text-success border-success/30">Cash</Badge>;
      case 'card':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Card</Badge>;
      case 'upi':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">UPI</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (!phone.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a phone number.', variant: 'destructive' });
      return false;
    }
    if (digits.length < 10) {
      toast({ title: 'Validation Error', description: 'Please enter a valid phone number (minimum 10 digits).', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter an email address.', variant: 'destructive' });
      return false;
    }
    if (!emailPattern.test(email.trim())) {
      toast({ title: 'Validation Error', description: 'Please enter a valid email address.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleWhatsAppShare = async () => {
    if (!validatePhone(phoneNumber)) return;

    setIsSending(true);
    try {
      const summaryData = {
        date: format(new Date(selectedDate), 'dd MMM yyyy'),
        cashTotal,
        cardTotal,
        upiTotal,
        grandTotal,
        totalTransactions,
      };

      const result = await sendDaySummary(phoneNumber, selectedDate, summaryData);

      if (result.success) {
        toast({
          title: result.mode === 'LOCAL' ? 'WhatsApp Ready' : 'WhatsApp Sent',
          description: result.message,
        });
        setShareDialog(null);
        setPhoneNumber('');
      } else {
        toast({
          title: 'WhatsApp Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send WhatsApp';
      toast({ title: 'WhatsApp Error', description: message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailShare = async () => {
    if (!validateEmail(emailAddress)) return;

    setIsSending(true);
    try {
      await billingService.sendDaySummaryEmail(selectedDate, emailAddress);
      toast({
        title: 'Email Sent',
        description: `Day payments summary PDF sent successfully to ${emailAddress}.`,
      });
      setShareDialog(null);
      setEmailAddress('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      toast({ title: 'Email Error', description: message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day Payments Summary - ${format(new Date(selectedDate), 'dd-MM-yyyy')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8B0000; padding-bottom: 15px; }
          .header h1 { color: #1a365d; font-size: 24px; }
          .header h2 { color: #8B0000; font-size: 16px; margin-top: 5px; }
          .summary-cards { display: flex; gap: 20px; margin: 30px 0; }
          .card { flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
          .card h3 { font-size: 28px; margin-bottom: 10px; }
          .card.cash { border-color: #22c55e; }
          .card.cash h3 { color: #22c55e; }
          .card.card-pay { border-color: #3b82f6; }
          .card.card-pay h3 { color: #3b82f6; }
          .card.upi { border-color: #a855f7; }
          .card.upi h3 { color: #a855f7; }
          .total-card { background: #1a365d; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
          .total-card h3 { font-size: 32px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BALAJI HEART CENTER</h1>
          <h2>Day Payments Summary</h2>
          <p>Date: ${format(new Date(selectedDate), 'dd MMM yyyy')}</p>
        </div>

        <div class="summary-cards">
          <div class="card cash">
            <h3>Rs.${cashTotal}</h3>
            <p>Cash Collection</p>
          </div>
          <div class="card card-pay">
            <h3>Rs.${cardTotal}</h3>
            <p>Card Collection</p>
          </div>
          <div class="card upi">
            <h3>Rs.${upiTotal}</h3>
            <p>UPI Collection</p>
          </div>
        </div>

        <div class="total-card">
          <p>Total Collection</p>
          <h3>Rs.${grandTotal}</h3>
          <p>${totalTransactions} Total Transactions</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Bill No</th>
              <th>Patient</th>
              <th>Method</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bills.map(bill => `
              <tr>
                <td>${format(new Date(bill.created_at), 'hh:mm a')}</td>
                <td>${bill.bill_number}</td>
                <td>${bill.patient_name}</td>
                <td>${(bill.payment_method || '-').toUpperCase()}</td>
                <td style="text-align: right;">Rs.${bill.paid_amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated on ${format(new Date(), 'dd-MM-yyyy hh:mm a')}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="medical-section space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Day Payments Summary</h2>
        </div>

        <div className="flex items-center gap-4">
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
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Today
            </Badge>
          )}
        </div>
      </div>

      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">Rs.{cashTotal}</p>
                <p className="text-sm text-muted-foreground">Cash Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">Rs.{cardTotal}</p>
                <p className="text-sm text-muted-foreground">Card Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">Rs.{upiTotal}</p>
                <p className="text-sm text-muted-foreground">UPI Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">Rs.{grandTotal}</p>
                <p className="text-sm opacity-80">Total Collection</p>
                <p className="text-xs opacity-70">{totalTransactions} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Summary
        </Button>
        <Button
          onClick={() => setShareDialog({ type: 'whatsapp' })}
          variant="outline"
          className="gap-2 text-success border-success/30 hover:bg-success/10"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </Button>
        <Button
          onClick={() => setShareDialog({ type: 'email' })}
          variant="outline"
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Email
        </Button>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found for selected date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>MR Number</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(bill.created_at), 'hh:mm a')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{bill.bill_number}</TableCell>
                      <TableCell className="font-medium">{bill.patient_name}</TableCell>
                      <TableCell className="font-mono text-sm">{bill.uhid || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(bill.payment_method)}
                          {getPaymentMethodBadge(bill.payment_method)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">Rs.{bill.paid_amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={!!shareDialog} onOpenChange={() => { setShareDialog(null); setPhoneNumber(''); setEmailAddress(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {shareDialog?.type === 'whatsapp' ? 'Send via WhatsApp' : 'Send via Email'}
            </DialogTitle>
            <DialogDescription>
              Share day payments summary
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">Summary for {format(new Date(selectedDate), 'dd MMM yyyy')}</p>
              <div className="text-sm space-y-1">
                <p className="flex justify-between"><span>Cash:</span> <span>Rs.{cashTotal}</span></p>
                <p className="flex justify-between"><span>Card:</span> <span>Rs.{cardTotal}</span></p>
                <p className="flex justify-between"><span>UPI:</span> <span>Rs.{upiTotal}</span></p>
                <p className="flex justify-between font-bold pt-2 border-t"><span>Total:</span> <span>Rs.{grandTotal}</span></p>
              </div>
            </div>

            {shareDialog?.type === 'whatsapp' && (
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

            {shareDialog?.type === 'email' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="manager@clinic.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={() => shareDialog?.type === 'whatsapp' ? handleWhatsAppShare() : handleEmailShare()}
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
                : shareDialog?.type === 'whatsapp'
                  ? 'Send via WhatsApp'
                  : 'Send Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
