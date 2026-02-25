/**
 * WhatsApp Service - Hybrid LOCAL/META mode for sending documents
 *
 * Mode is controlled by VITE_WHATSAPP_MODE environment variable:
 * - META: Uses WhatsApp Business Cloud API via backend (production)
 * - LOCAL: Downloads PDF + opens WhatsApp link for manual send (development/fallback)
 *
 * Supported document types:
 * - Prescriptions
 * - Bills/Receipts
 * - Day Payment Summaries
 *
 * LOCAL mode uses the SAME backend PDF generation endpoints as Email flow.
 * No files are permanently stored - PDFs are generated dynamically.
 */

import prescriptionService from './prescriptionService';
import billingService from './billingService';

export type WhatsAppMode = 'LOCAL' | 'META';

export interface WhatsAppSendResult {
  success: boolean;
  mode: WhatsAppMode;
  message: string;
}

/**
 * Get the current WhatsApp mode from environment
 */
export function getWhatsAppMode(): WhatsAppMode {
  const mode = import.meta.env.VITE_WHATSAPP_MODE?.toUpperCase();
  return mode === 'LOCAL' ? 'LOCAL' : 'META';
}

/**
 * Sanitize phone number for WhatsApp
 * - Removes spaces, dashes, parentheses, and other non-digit characters
 * - Ensures country code (defaults to 91 for India)
 * - Returns clean number suitable for WhatsApp URLs
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle Indian numbers
  if (cleaned.startsWith('0')) {
    // Local format: 0XXXXXXXXXX -> 91XXXXXXXXXX
    cleaned = '91' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // 10-digit number without country code
    cleaned = '91' + cleaned;
  } else if (!cleaned.startsWith('91') && cleaned.length > 10) {
    // Has some prefix but not 91
    // Only add 91 if it doesn't already have a valid country code
    const hasValidCountryCode = /^(1|44|61|971|966|65|60|86|81|82|49|33|39)/.test(cleaned);
    if (!hasValidCountryCode) {
      cleaned = '91' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Open WhatsApp chat - tries native protocol first, then web fallback
 */
function openWhatsAppChat(phone: string, message?: string): void {
  const sanitized = sanitizePhoneNumber(phone);
  if (!sanitized) return;

  const encodedMessage = message ? encodeURIComponent(message) : '';

  // Try native WhatsApp protocol first (better UX on desktop with WhatsApp installed)
  const nativeUrl = `whatsapp://send?phone=${sanitized}${encodedMessage ? `&text=${encodedMessage}` : ''}`;
  const webUrl = `https://wa.me/${sanitized}${encodedMessage ? `?text=${encodedMessage}` : ''}`;

  // Create a hidden link to test native protocol
  const testLink = document.createElement('a');
  testLink.href = nativeUrl;

  // Try native first, fallback to web after short delay
  const webFallbackTimeout = setTimeout(() => {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }, 500);

  // If native protocol works, clear the web fallback
  window.addEventListener(
    'blur',
    () => {
      clearTimeout(webFallbackTimeout);
    },
    { once: true }
  );

  // Attempt native protocol
  window.location.href = nativeUrl;
}

/**
 * Get access token from localStorage
 */
function getAccessToken(): string {
  return localStorage.getItem('access_token') || '';
}

/**
 * Fetch PDF from backend URL with authorization
 * Uses the same endpoints as Email flow - PDF is generated dynamically
 *
 * @throws Error on 401 (Unauthorized), 403 (Forbidden), or other failures
 */
async function fetchPdfAsBlob(url: string): Promise<Blob> {
  const token = getAccessToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    },
  });

  if (response.status === 401) {
    throw new Error('Session expired. Please login again.');
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to download this document.');
  }

  if (!response.ok) {
    throw new Error('Failed to download PDF. Please try again.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/pdf')) {
    // Backend might return JSON error
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to generate PDF.');
  }

  return response.blob();
}

/**
 * Download a PDF blob to user's device
 * Creates temporary object URL, triggers download, then cleans up
 */
function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke object URL after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download prescription PDF to user's device
 */
async function downloadPrescriptionPdf(prescriptionId: string, opNumber: string): Promise<void> {
  const blob = await prescriptionService.downloadPdf(prescriptionId);
  downloadPdfBlob(blob, `prescription-${opNumber}.pdf`);
}

/**
 * Download bill receipt PDF to user's device
 * Uses same backend endpoint as Email flow
 */
async function downloadBillReceiptPdf(billId: string, billNumber: string): Promise<void> {
  const pdfUrl = billingService.getReceiptPdfUrl(billId);
  const blob = await fetchPdfAsBlob(pdfUrl);
  downloadPdfBlob(blob, `receipt-${billNumber}.pdf`);
}

/**
 * Download day summary PDF to user's device
 * Uses same backend endpoint as Email flow
 */
async function downloadDaySummaryPdf(targetDate: string): Promise<void> {
  const pdfUrl = billingService.getDaySummaryPdfUrl(targetDate);
  const blob = await fetchPdfAsBlob(pdfUrl);
  downloadPdfBlob(blob, `day-summary-${targetDate}.pdf`);
}

/**
 * Send prescription to patient via WhatsApp
 * Handles both LOCAL and META modes
 */
export async function sendPrescriptionToPatient(
  prescriptionId: string,
  phone: string,
  patientName: string,
  opNumber: string
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode();

  if (mode === 'LOCAL') {
    try {
      // Download PDF first (same backend endpoint as email)
      await downloadPrescriptionPdf(prescriptionId, opNumber);

      // Open WhatsApp chat
      const message = `Hi ${patientName}, your prescription (${opNumber}) from Balaji Heart Center is ready. Please find the attached PDF.`;
      openWhatsAppChat(phone, message);

      return {
        success: true,
        mode: 'LOCAL',
        message: 'PDF downloaded. Please attach and send in WhatsApp.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      return {
        success: false,
        mode: 'LOCAL',
        message: errorMsg,
      };
    }
  }

  // META mode - use backend WhatsApp Cloud API
  try {
    await prescriptionService.sendWhatsApp(prescriptionId, phone);
    return {
      success: true,
      mode: 'META',
      message: `Prescription sent to ${patientName} via WhatsApp successfully.`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send via WhatsApp';
    return {
      success: false,
      mode: 'META',
      message: errorMsg,
    };
  }
}

/**
 * Send prescription to Lab via WhatsApp
 */
export async function sendPrescriptionToLab(
  prescriptionId: string,
  labPhone: string,
  patientName: string,
  opNumber: string
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode();

  if (mode === 'LOCAL') {
    try {
      await downloadPrescriptionPdf(prescriptionId, opNumber);
      const message = `Lab Request - ${opNumber}\nPatient: ${patientName}\nFrom Balaji Heart Center\nPlease process and update results.`;
      openWhatsAppChat(labPhone, message);

      return {
        success: true,
        mode: 'LOCAL',
        message: 'PDF downloaded. Please attach and send to Lab in WhatsApp.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      return {
        success: false,
        mode: 'LOCAL',
        message: errorMsg,
      };
    }
  }

  // META mode
  try {
    await prescriptionService.sendToLabWhatsApp(prescriptionId);
    return {
      success: true,
      mode: 'META',
      message: 'Prescription sent to Lab via WhatsApp.',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send to Lab via WhatsApp';
    return {
      success: false,
      mode: 'META',
      message: errorMsg,
    };
  }
}

/**
 * Send prescription to Pharmacy via WhatsApp
 */
export async function sendPrescriptionToPharmacy(
  prescriptionId: string,
  pharmacyPhone: string,
  patientName: string,
  opNumber: string
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode();

  if (mode === 'LOCAL') {
    try {
      await downloadPrescriptionPdf(prescriptionId, opNumber);
      const message = `Pharmacy Order - ${opNumber}\nPatient: ${patientName}\nFrom Balaji Heart Center\nPlease dispense as prescribed.`;
      openWhatsAppChat(pharmacyPhone, message);

      return {
        success: true,
        mode: 'LOCAL',
        message: 'PDF downloaded. Please attach and send to Pharmacy in WhatsApp.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      return {
        success: false,
        mode: 'LOCAL',
        message: errorMsg,
      };
    }
  }

  // META mode
  try {
    await prescriptionService.sendToPharmacyWhatsApp(prescriptionId);
    return {
      success: true,
      mode: 'META',
      message: 'Prescription sent to Pharmacy via WhatsApp.',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send to Pharmacy via WhatsApp';
    return {
      success: false,
      mode: 'META',
      message: errorMsg,
    };
  }
}

/**
 * Send bill receipt to patient via WhatsApp
 * Handles both LOCAL and META modes
 *
 * LOCAL mode: Downloads PDF from backend (same endpoint as email), opens WhatsApp
 * META mode: Calls backend WhatsApp Cloud API endpoint
 */
export async function sendBillToPatient(
  billId: string,
  phone: string,
  patientName: string,
  billNumber: string
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode();

  if (mode === 'LOCAL') {
    try {
      // Download PDF from backend (same endpoint used for email)
      await downloadBillReceiptPdf(billId, billNumber);

      // Open WhatsApp chat
      const message = `Hi ${patientName}, your bill receipt (${billNumber}) from Balaji Heart Center is attached. Thank you for your visit.`;
      openWhatsAppChat(phone, message);

      return {
        success: true,
        mode: 'LOCAL',
        message: 'PDF downloaded. Please attach and send in WhatsApp.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      return {
        success: false,
        mode: 'LOCAL',
        message: errorMsg,
      };
    }
  }

  // META mode - use backend WhatsApp Cloud API
  try {
    await billingService.sendWhatsApp(billId, phone);
    return {
      success: true,
      mode: 'META',
      message: `Bill receipt sent to ${patientName} via WhatsApp successfully.`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send via WhatsApp';
    return {
      success: false,
      mode: 'META',
      message: errorMsg,
    };
  }
}

/**
 * Day summary data interface (used for WhatsApp message text in LOCAL mode)
 */
export interface DaySummaryData {
  date: string;
  cashTotal: number;
  cardTotal: number;
  upiTotal: number;
  grandTotal: number;
  totalTransactions: number;
}

/**
 * Send day payment summary via WhatsApp
 * Handles both LOCAL and META modes
 *
 * LOCAL mode: Downloads PDF from backend (same endpoint as email), opens WhatsApp
 * META mode: Calls backend WhatsApp Cloud API endpoint
 *
 * @param phone - Phone number to send to
 * @param targetDate - Date in YYYY-MM-DD format
 * @param summaryData - Summary data for WhatsApp message text
 */
export async function sendDaySummary(
  phone: string,
  targetDate: string,
  summaryData: DaySummaryData
): Promise<WhatsAppSendResult> {
  const mode = getWhatsAppMode();

  if (mode === 'LOCAL') {
    try {
      // Download PDF from backend (same endpoint used for email)
      await downloadDaySummaryPdf(targetDate);

      // Open WhatsApp chat with summary in message
      const message = `Balaji Heart Center - Day Summary (${summaryData.date})

Cash: Rs.${summaryData.cashTotal}
Card: Rs.${summaryData.cardTotal}
UPI: Rs.${summaryData.upiTotal}
Total: Rs.${summaryData.grandTotal} (${summaryData.totalTransactions} transactions)

Please find the detailed PDF attached.`;
      openWhatsAppChat(phone, message);

      return {
        success: true,
        mode: 'LOCAL',
        message: 'PDF downloaded. Please attach and send in WhatsApp.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      return {
        success: false,
        mode: 'LOCAL',
        message: errorMsg,
      };
    }
  }

  // META mode - use backend WhatsApp Cloud API
  try {
    await billingService.sendDaySummaryWhatsApp(targetDate, phone);
    return {
      success: true,
      mode: 'META',
      message: 'Day summary sent via WhatsApp successfully.',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to send via WhatsApp';
    return {
      success: false,
      mode: 'META',
      message: errorMsg,
    };
  }
}

/**
 * Check if LOCAL mode is active
 */
export function isLocalMode(): boolean {
  return getWhatsAppMode() === 'LOCAL';
}

export default {
  getWhatsAppMode,
  sanitizePhoneNumber,
  sendPrescriptionToPatient,
  sendPrescriptionToLab,
  sendPrescriptionToPharmacy,
  sendBillToPatient,
  sendDaySummary,
  isLocalMode,
};
