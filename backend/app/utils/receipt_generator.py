"""
Receipt Generator - Generates bill receipt HTML and PDF.

Mirrors the frontend print template from BillsList.tsx / BillingSection.tsx.
Uses table-based layout for xhtml2pdf compatibility (no flexbox support).
Uses 'Rs.' for currency since xhtml2pdf default fonts lack the rupee symbol.
"""

import json
import os
import re
import tempfile
from datetime import datetime
from pathlib import Path

from app.models.billing import Bill

LOGO_PATH = Path(__file__).parent.parent.parent / "assets" / "logo.jpeg"


def _fmt(amount) -> str:
    """Format a number to 2 decimal places."""
    return f"{float(amount or 0):.2f}"


def _format_date(dt: datetime) -> str:
    if not dt:
        return "-"
    return dt.strftime("%d-%m-%Y")


def _format_time(dt: datetime) -> str:
    if not dt:
        return "-"
    return dt.strftime("%I:%M %p")


def _number_to_words(num: float) -> str:
    if not num or num == 0:
        return "ZERO"
    n = abs(round(num))
    ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE',
            'SIX', 'SEVEN', 'EIGHT', 'NINE']
    teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN',
             'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
    tens_list = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY',
                 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
    if n < 10:
        return ones[n]
    if n < 20:
        return teens[n - 10]
    if n < 100:
        return tens_list[n // 10] + (' ' + ones[n % 10] if n % 10 else '')
    if n < 1000:
        return (ones[n // 100] + ' HUNDRED'
                + (' ' + _number_to_words(n % 100) if n % 100 else ''))
    if n < 100000:
        return (_number_to_words(n // 1000) + ' THOUSAND'
                + (' ' + _number_to_words(n % 1000) if n % 1000 else ''))
    return (_number_to_words(n // 100000) + ' LAKH'
            + (' ' + _number_to_words(n % 100000) if n % 100000 else ''))


def _parse_other_charges(text: str) -> int:
    if not text:
        return 0
    numbers = re.findall(r'\d+', text)
    return sum(int(n) for n in numbers) if numbers else 0


def _get_logo_base64() -> str:
    import base64
    if LOGO_PATH.exists():
        with open(LOGO_PATH, "rb") as f:
            data = base64.b64encode(f.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{data}"
    return ""


def _esc(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generate_receipt_html(bill: Bill) -> str:
    """Generate bill receipt HTML for PDF rendering via xhtml2pdf.

    Uses table-based layout (xhtml2pdf has no flexbox support) and 'Rs.'
    for currency (default PDF fonts lack the rupee symbol).
    """
    consultation_fee = float(bill.consultation_fee or 0)

    lab_items = []
    if bill.lab_and_investigations:
        try:
            lab_items = json.loads(bill.lab_and_investigations)
        except (json.JSONDecodeError, TypeError):
            pass

    lab_total = sum(float(i.get("amount", 0)) for i in lab_items)
    other_text = bill.other_charges or ""
    other_total = _parse_other_charges(other_text)

    total_amount = float(bill.total_amount or 0)
    paid_amount = float(bill.paid_amount or 0)
    due_amount = float(bill.due_amount or 0)
    discount_amount = float(bill.discount_amount or 0)
    discount_percent = float(bill.discount_percent or 0)
    pre_discount = consultation_fee + lab_total + other_total
    pay_method = (bill.payment_method.value if bill.payment_method else "cash").upper()

    # --- Line item rows ---
    sl = 1
    rows = ""
    if consultation_fee > 0:
        rows += (
            f'<tr><td align="center">{sl}</td>'
            f'<td>Consultation Fees</td>'
            f'<td align="center">1</td>'
            f'<td align="right">Rs. {_fmt(consultation_fee)}</td>'
            f'<td align="right">Rs. {_fmt(consultation_fee)}</td></tr>'
        )
        sl += 1

    for item in lab_items:
        amt = float(item.get("amount", 0))
        rows += (
            f'<tr><td align="center">{sl}</td>'
            f'<td>{_esc(item.get("name", "Lab Test"))}</td>'
            f'<td align="center">1</td>'
            f'<td align="right">Rs. {_fmt(amt)}</td>'
            f'<td align="right">Rs. {_fmt(amt)}</td></tr>'
        )
        sl += 1

    if other_total > 0:
        desc = "Other Charges"
        if other_text:
            desc += f" ({_esc(other_text)})"
        rows += (
            f'<tr><td align="center">{sl}</td>'
            f'<td>{desc}</td>'
            f'<td align="center">1</td>'
            f'<td align="right">Rs. {_fmt(other_total)}</td>'
            f'<td align="right">Rs. {_fmt(other_total)}</td></tr>'
        )
        sl += 1

    # --- Conditional pieces ---
    pay_ref_row = ""
    if bill.payment_reference:
        pay_ref_row = (
            f'<p style="margin:1px 0;"><b style="color:#a63d40;">REF/TXN ID:</b>'
            f' {_esc(bill.payment_reference)}</p>'
        )

    discount_row = ""
    if discount_amount > 0:
        discount_row = (
            f'<tr><td align="right" style="color:#22c55e;padding:1px 0;">'
            f'DISCOUNT ({discount_percent}%): -Rs. {_fmt(discount_amount)}</td></tr>'
        )

    other_summary_row = ""
    if other_total > 0:
        other_summary_row = (
            f'<tr><td align="right" style="padding:1px 0;">'
            f'Other Charges: Rs. {_fmt(other_total)}</td></tr>'
        )

    logo_src = _get_logo_base64()
    logo_img = f'<img src="{logo_src}" width="60" height="60" />' if logo_src else ""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Bill Receipt - {bill.bill_number or 'Receipt'}</title>
<style>
    @page {{
        size: A4;
        margin: 1cm 1.2cm;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11px;
        color: #222;
        margin: 0;
        padding: 0;
    }}
    p {{
        margin: 1px 0;
    }}
    h1 {{
        font-size: 20px;
        color: #0d7377;
        margin: 0;
        padding: 0;
    }}
    .subtitle {{
        color: #a63d40;
        font-weight: bold;
        font-size: 9px;
        margin: 0;
    }}
    .clinic-info {{
        color: #555;
        font-size: 9px;
        margin: 0;
    }}
    .divider {{
        border: none;
        border-top: 3px solid #0d7377;
        margin: 6px 0;
    }}
    .bill-title {{
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        color: #0d7377;
        padding: 6px 0;
        margin: 0;
    }}
    .info-box {{
        background-color: #f4f6f7;
        padding: 6px 8px;
        margin-bottom: 6px;
    }}
    .label {{
        color: #a63d40;
        font-weight: bold;
    }}
    .items-table {{
        width: 100%;
        border-collapse: collapse;
        margin: 6px 0;
    }}
    .items-table th {{
        background-color: #0d7377;
        color: #ffffff;
        padding: 5px 6px;
        text-align: left;
        font-size: 10px;
    }}
    .items-table td {{
        border: 1px solid #cccccc;
        padding: 4px 6px;
        font-size: 10px;
    }}
    .summary-label {{
        font-weight: bold;
        font-size: 12px;
    }}
    .net-amount {{
        font-size: 13px;
        font-weight: bold;
        color: #0d7377;
    }}
    .due-amount {{
        font-weight: bold;
        font-size: 12px;
        color: #a63d40;
    }}
    .words-box {{
        background-color: #eef5f5;
        border-left: 4px solid #0d7377;
        padding: 5px 8px;
        margin: 8px 0;
        font-size: 10px;
    }}
    .footer-bar {{
        border-top: 2px solid #0d7377;
        text-align: center;
        color: #666;
        font-size: 9px;
        padding-top: 6px;
        margin-top: 15px;
    }}
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
    <td width="70" valign="top">{logo_img}</td>
    <td valign="top" style="padding-left:10px;">
        <h1>BALAJI HEART CENTER</h1>
        <p class="subtitle">YES, THE 'ADVANTAGE' HEART CLINIC!</p>
        <p class="clinic-info">SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>
        <p class="clinic-info">Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>
    </td>
</tr>
</table>

<hr class="divider"/>

<p class="bill-title">BILL RECEIPT</p>

<!-- BILL INFO -->
<table width="100%" class="info-box" cellpadding="1" cellspacing="0">
<tr>
    <td width="50%" valign="top">
        <p><span class="label">BILL NO:</span> {bill.bill_number or '-'}</p>
        <p><span class="label">MR NO:</span> {bill.uhid or '-'}</p>
        <p><span class="label">PATIENT:</span> {_esc(bill.patient_name) or '-'}</p>
        <p><span class="label">MOBILE:</span> {bill.mobile_no or '-'}</p>
    </td>
    <td width="50%" valign="top" align="right">
        <p><span class="label">DATE:</span> {_format_date(bill.created_at)}</p>
        <p><span class="label">TIME:</span> {_format_time(bill.created_at)}</p>
        <p><span class="label">DOCTOR:</span> {_esc(bill.doctor_name) or '-'}</p>
    </td>
</tr>
</table>

<!-- LINE ITEMS TABLE -->
<table class="items-table" cellpadding="0" cellspacing="0">
<thead>
<tr>
    <th width="45" align="center">SL NO</th>
    <th>SERVICE NAME</th>
    <th width="40" align="center">QTY</th>
    <th width="85" align="right">RATE</th>
    <th width="95" align="right">NET AMOUNT</th>
</tr>
</thead>
<tbody>
{rows}
</tbody>
</table>

<!-- PAYMENT SECTION -->
<table width="100%" cellpadding="2" cellspacing="0">
<tr>
    <td width="48%" valign="top">
        <p style="margin:1px 0;"><b class="label">PAYMENT DETAILS</b></p>
        <p style="margin:1px 0;"><b class="label">PAY MODE:</b> {pay_method}</p>
        <p style="margin:1px 0;"><b class="label">PAID AMOUNT:</b> Rs. {_fmt(paid_amount)}</p>
        {pay_ref_row}
    </td>
    <td width="52%" valign="top">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="right" style="padding:1px 0;">Consultation: Rs. {_fmt(consultation_fee)}</td></tr>
            <tr><td align="right" style="padding:1px 0;">Lab Total: Rs. {_fmt(lab_total)}</td></tr>
            {other_summary_row}
            <tr><td align="right" style="padding:2px 0;" class="summary-label">TOTAL AMOUNT: Rs. {_fmt(pre_discount)}</td></tr>
            {discount_row}
            <tr><td align="right" style="padding:2px 0;" class="net-amount">NET AMOUNT: Rs. {_fmt(total_amount)}</td></tr>
            <tr><td align="right" style="padding:2px 0;" class="due-amount">DUE: Rs. {_fmt(due_amount)}</td></tr>
        </table>
    </td>
</tr>
</table>

<!-- AMOUNT IN WORDS -->
<div class="words-box">
    <p>RECEIVED WITH THANKS A SUM OF Rs. {_fmt(paid_amount)} ONLY</p>
    <p>AMOUNT IN WORDS: {_number_to_words(paid_amount)} RUPEES ONLY</p>
</div>

<!-- SIGNATURE -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
<tr>
    <td align="right">
        <table cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid #000;padding-top:4px;text-align:center;width:160px;font-size:10px;">
            Authorised Signatory
        </td></tr>
        </table>
    </td>
</tr>
</table>

<!-- FOOTER -->
<div class="footer-bar">
    <p>Thank you for visiting Balaji Heart Center</p>
    <p>For Appointments: +91 9100079990 / 9010278278 / 040-2303 2345</p>
    <p>www.balajiheartcenter.com</p>
</div>

</body>
</html>"""

    return html


def generate_day_summary_html(
    summary_date: str,
    cash_total: float,
    card_total: float,
    upi_total: float,
    grand_total: float,
    total_transactions: int,
    bills: list,
) -> str:
    """Generate day payment summary HTML for PDF rendering via xhtml2pdf.

    Uses table-based layout (xhtml2pdf has no flexbox support) and 'Rs.'
    for currency. Mirrors the frontend DayPayments print template.
    """
    from datetime import datetime as dt

    logo_src = _get_logo_base64()
    logo_img = f'<img src="{logo_src}" width="60" height="60" />' if logo_src else ""

    # Build transaction rows
    rows = ""
    for idx, b in enumerate(bills):
        bill_time = "-"
        if b.get("created_at"):
            try:
                bill_time = dt.fromisoformat(b["created_at"]).strftime("%I:%M %p")
            except (ValueError, TypeError):
                bill_time = "-"
        method = (b.get("payment_method") or "-").upper()
        bg = ' style="background-color:#f8f9fa;"' if idx % 2 == 0 else ""
        rows += (
            f'<tr{bg}>'
            f'<td align="center" style="padding:6px 8px;">{bill_time}</td>'
            f'<td style="padding:6px 8px;">{_esc(b.get("bill_number", "-"))}</td>'
            f'<td style="padding:6px 8px;">{_esc(b.get("patient_name", "-"))}</td>'
            f'<td style="padding:6px 8px;">{_esc(b.get("uhid", "-"))}</td>'
            f'<td align="center" style="padding:6px 8px;">{method}</td>'
            f'<td align="right" style="padding:6px 8px;font-weight:bold;">Rs. {_fmt(b.get("paid_amount", 0))}</td>'
            f'</tr>'
        )

    if not bills:
        rows = (
            '<tr><td colspan="6" align="center" style="padding:20px;color:#888;">'
            'No transactions for this date</td></tr>'
        )

    generated_on = dt.now().strftime("%d-%m-%Y %I:%M %p")

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Day Payments Summary - {_esc(summary_date)}</title>
<style>
    @page {{
        size: A4;
        margin: 1.5cm 1.5cm;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11px;
        color: #222;
        margin: 0;
        padding: 0;
    }}
    p {{
        margin: 2px 0;
    }}
    h1 {{
        font-size: 22px;
        color: #1a365d;
        margin: 0;
        padding: 0;
    }}
    .subtitle {{
        color: #8B0000;
        font-weight: bold;
        font-size: 9px;
        margin: 2px 0 0 0;
    }}
    .clinic-info {{
        color: #555;
        font-size: 9px;
        margin: 1px 0;
    }}
    .divider {{
        border: none;
        border-top: 2px solid #8B0000;
        margin: 8px 0;
    }}
    .section-title {{
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: #1a365d;
        padding: 8px 0 2px 0;
        margin: 0;
    }}
    .date-line {{
        text-align: center;
        font-size: 12px;
        color: #444;
        margin: 0 0 12px 0;
    }}
    .summary-table {{
        width: 100%;
        margin: 8px 0 12px 0;
        border-collapse: separate;
    }}
    .summary-card {{
        border: 2px solid #cccccc;
        padding: 12px 8px;
        text-align: center;
        width: 33%;
    }}
    .summary-card.cash {{
        border-color: #22c55e;
        background-color: #f0fdf4;
    }}
    .summary-card.card-pay {{
        border-color: #3b82f6;
        background-color: #eff6ff;
    }}
    .summary-card.upi {{
        border-color: #a855f7;
        background-color: #faf5ff;
    }}
    .amount-text {{
        font-size: 22px;
        font-weight: bold;
        margin: 0;
        padding: 0 0 4px 0;
    }}
    .amount-label {{
        font-size: 10px;
        color: #555;
        margin: 0;
    }}
    .cash .amount-text {{
        color: #16a34a;
    }}
    .card-pay .amount-text {{
        color: #2563eb;
    }}
    .upi .amount-text {{
        color: #9333ea;
    }}
    .total-table {{
        width: 100%;
        margin: 0 0 14px 0;
    }}
    .total-cell {{
        background-color: #1a365d;
        color: #ffffff;
        text-align: center;
        padding: 14px 10px;
    }}
    .total-label {{
        font-size: 11px;
        margin: 0;
        opacity: 0.9;
    }}
    .total-amount {{
        font-size: 28px;
        font-weight: bold;
        margin: 4px 0;
    }}
    .total-count {{
        font-size: 10px;
        margin: 0;
        opacity: 0.8;
    }}
    .items-table {{
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 12px 0;
    }}
    .items-table th {{
        background-color: #1a365d;
        color: #ffffff;
        padding: 8px 8px;
        text-align: left;
        font-size: 10px;
        font-weight: bold;
    }}
    .items-table td {{
        border-bottom: 1px solid #e2e8f0;
        padding: 6px 8px;
        font-size: 10px;
    }}
    .footer-bar {{
        border-top: 2px solid #1a365d;
        text-align: center;
        color: #666;
        font-size: 9px;
        padding-top: 8px;
        margin-top: 16px;
    }}
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
    <td width="70" valign="top">{logo_img}</td>
    <td valign="top" style="padding-left:12px;">
        <h1>BALAJI HEART CENTER</h1>
        <p class="subtitle">YES, THE 'ADVANTAGE' HEART CLINIC!</p>
        <p class="clinic-info">SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>
        <p class="clinic-info">Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>
    </td>
</tr>
</table>

<hr class="divider"/>

<p class="section-title">DAY PAYMENTS SUMMARY</p>
<p class="date-line">Date: {_esc(summary_date)}</p>

<!-- SUMMARY CARDS -->
<table class="summary-table" cellpadding="0" cellspacing="6">
<tr>
    <td class="summary-card cash">
        <p class="amount-text">Rs. {_fmt(cash_total)}</p>
        <p class="amount-label">Cash Collection</p>
    </td>
    <td class="summary-card card-pay">
        <p class="amount-text">Rs. {_fmt(card_total)}</p>
        <p class="amount-label">Card Collection</p>
    </td>
    <td class="summary-card upi">
        <p class="amount-text">Rs. {_fmt(upi_total)}</p>
        <p class="amount-label">UPI Collection</p>
    </td>
</tr>
</table>

<!-- TOTAL -->
<table class="total-table" cellpadding="0" cellspacing="0">
<tr>
    <td class="total-cell">
        <p class="total-label">Total Collection</p>
        <p class="total-amount">Rs. {_fmt(grand_total)}</p>
        <p class="total-count">{total_transactions} Transaction{'s' if total_transactions != 1 else ''}</p>
    </td>
</tr>
</table>

<!-- TRANSACTIONS TABLE -->
<table class="items-table" cellpadding="0" cellspacing="0">
<thead>
<tr>
    <th width="70" align="center">TIME</th>
    <th width="130">BILL NO</th>
    <th>PATIENT</th>
    <th width="80">MR NO</th>
    <th width="65" align="center">METHOD</th>
    <th width="90" align="right">AMOUNT</th>
</tr>
</thead>
<tbody>
{rows}
</tbody>
</table>

<!-- FOOTER -->
<div class="footer-bar">
    <p>Generated on {generated_on}</p>
    <p>Balaji Heart Center | Ph: +91 9100079990 | www.balajiheartcenter.com</p>
</div>

</body>
</html>"""

    return html


def generate_day_summary_pdf(
    summary_date: str,
    cash_total: float,
    card_total: float,
    upi_total: float,
    grand_total: float,
    total_transactions: int,
    bills: list,
) -> str:
    """Generate day payment summary PDF and return the temp file path.

    The caller is responsible for deleting the file after use.
    """
    from xhtml2pdf import pisa

    html = generate_day_summary_html(
        summary_date=summary_date,
        cash_total=cash_total,
        card_total=card_total,
        upi_total=upi_total,
        grand_total=grand_total,
        total_transactions=total_transactions,
        bills=bills,
    )

    fd, pdf_path = tempfile.mkstemp(
        suffix=".pdf",
        prefix=f"day_summary_{summary_date}_",
    )
    try:
        with os.fdopen(fd, "wb") as f:
            result = pisa.CreatePDF(html, dest=f)
            if result.err:
                raise RuntimeError(
                    f"PDF generation failed for day summary {summary_date}"
                )
    except Exception:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    return pdf_path


def generate_receipt_pdf(bill: Bill) -> str:
    """Generate bill receipt PDF and return the temp file path.

    The caller is responsible for deleting the file after use.
    """
    from xhtml2pdf import pisa

    html = generate_receipt_html(bill)

    fd, pdf_path = tempfile.mkstemp(
        suffix=".pdf",
        prefix=f"receipt_{bill.bill_number}_",
    )
    try:
        with os.fdopen(fd, "wb") as f:
            result = pisa.CreatePDF(html, dest=f)
            if result.err:
                raise RuntimeError(
                    f"PDF generation failed for bill {bill.bill_number}"
                )
    except Exception:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    return pdf_path
