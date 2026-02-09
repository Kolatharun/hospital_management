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
    txn_row = ""
    pay_ref_row = ""
    if bill.payment_reference:
        txn_row = f'<tr><td align="right"><b style="color:#a63d40;">TXN ID:</b> {_esc(bill.payment_reference)}</td></tr>'
        pay_ref_row = f'<p><b style="color:#a63d40;">REF/TXN ID:</b> {_esc(bill.payment_reference)}</p>'

    discount_row = ""
    if discount_amount > 0:
        discount_row = (
            f'<tr><td align="right" style="color:#22c55e;">'
            f'DISCOUNT ({discount_percent}%): -Rs. {_fmt(discount_amount)}</td></tr>'
        )

    other_summary_row = ""
    if other_total > 0:
        other_summary_row = f'<tr><td align="right">Other Charges: Rs. {_fmt(other_total)}</td></tr>'

    logo_src = _get_logo_base64()
    logo_img = f'<img src="{logo_src}" width="70" height="70" />' if logo_src else ""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Bill Receipt - {bill.bill_number or 'Receipt'}</title>
<style>
    @page {{
        size: A4;
        margin: 1.5cm;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11px;
        color: #222;
        margin: 0;
        padding: 0;
    }}
    h1 {{
        font-size: 22px;
        color: #0d7377;
        margin: 0;
        padding: 0;
    }}
    .subtitle {{
        color: #a63d40;
        font-weight: bold;
        font-size: 10px;
    }}
    .clinic-info {{
        color: #555;
        font-size: 10px;
    }}
    .divider {{
        border: none;
        border-top: 3px solid #0d7377;
        margin: 10px 0;
    }}
    .bill-title {{
        text-align: center;
        font-size: 17px;
        font-weight: bold;
        color: #0d7377;
        padding: 12px 0;
    }}
    .info-box {{
        background-color: #f4f6f7;
        padding: 10px;
        margin-bottom: 12px;
    }}
    .label {{
        color: #a63d40;
        font-weight: bold;
    }}
    .items-table {{
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
    }}
    .items-table th {{
        background-color: #0d7377;
        color: #ffffff;
        padding: 7px 8px;
        text-align: left;
        font-size: 11px;
    }}
    .items-table td {{
        border: 1px solid #cccccc;
        padding: 6px 8px;
        font-size: 11px;
    }}
    .summary-label {{
        font-weight: bold;
        font-size: 13px;
    }}
    .net-amount {{
        font-size: 15px;
        font-weight: bold;
        color: #0d7377;
    }}
    .due-amount {{
        font-weight: bold;
        font-size: 13px;
        color: #a63d40;
    }}
    .words-box {{
        background-color: #eef5f5;
        border-left: 4px solid #0d7377;
        padding: 8px 10px;
        margin: 14px 0;
    }}
    .footer-bar {{
        border-top: 2px solid #0d7377;
        text-align: center;
        color: #666;
        font-size: 10px;
        padding-top: 10px;
        margin-top: 25px;
    }}
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
    <td width="80" valign="top">{logo_img}</td>
    <td valign="top" style="padding-left:12px;">
        <h1>BALAJI HEART CENTER</h1>
        <p class="subtitle">YES, THE 'ADVANTAGE' HEART CLINIC!</p>
        <p class="clinic-info">SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>
        <p class="clinic-info">Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>
    </td>
</tr>
</table>

<hr class="divider"/>

<div class="bill-title">BILL RECEIPT</div>

<!-- BILL INFO -->
<table width="100%" class="info-box" cellpadding="2" cellspacing="0">
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
    <th width="50" align="center">SL NO</th>
    <th>SERVICE NAME</th>
    <th width="50" align="center">QTY</th>
    <th width="90" align="right">RATE</th>
    <th width="100" align="right">NET AMOUNT</th>
</tr>
</thead>
<tbody>
{rows}
</tbody>
</table>

<!-- PAYMENT SECTION -->
<table width="100%" cellpadding="4" cellspacing="0">
<tr>
    <td width="50%" valign="top">
        <p><b class="label">PAYMENT DETAILS</b></p>
        <p><b class="label">PAY MODE:</b> {pay_method}</p>
        <p><b class="label">PAID AMOUNT:</b> Rs. {_fmt(paid_amount)}</p>
        {pay_ref_row}
    </td>
    <td width="50%" valign="top">
        <table width="100%" cellpadding="2" cellspacing="0">
            <tr><td align="right">Consultation: Rs. {_fmt(consultation_fee)}</td></tr>
            <tr><td align="right">Lab Total: Rs. {_fmt(lab_total)}</td></tr>
            {other_summary_row}
            <tr><td align="right" class="summary-label">TOTAL AMOUNT: Rs. {_fmt(pre_discount)}</td></tr>
            {discount_row}
            <tr><td align="right" class="net-amount">NET AMOUNT: Rs. {_fmt(total_amount)}</td></tr>
            <tr><td align="right" class="due-amount">DUE: Rs. {_fmt(due_amount)}</td></tr>
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
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
<tr>
    <td align="right">
        <table cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid #000; padding-top:5px; text-align:center; width:180px;">
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
