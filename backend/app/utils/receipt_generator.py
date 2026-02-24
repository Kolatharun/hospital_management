"""
Receipt Generator - Generates bill receipt HTML and PDF.

Mirrors the frontend print template from BillsList.tsx / BillingSection.tsx.
Uses Playwright for PDF generation (supports modern CSS: flexbox, grid).
High-resolution output with proper logo clarity and print-quality sharpness.
"""

import base64
import json
import logging
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from app.models.billing import Bill

logger = logging.getLogger(__name__)

LOGO_PATH = Path(__file__).parent.parent.parent / "assets" / "logo.jpeg"

# Playwright PDF generation script (runs in subprocess for Windows compatibility)
_PDF_SCRIPT = '''
import sys
import json

def main():
    data = json.loads(sys.stdin.read())
    html_content = data["html"]
    output_path = data["output"]

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        page.pdf(
            path=output_path,
            format="A4",
            margin={"top": "10mm", "right": "10mm", "bottom": "10mm", "left": "10mm"},
            print_background=True,
            scale=1.0,
        )
        browser.close()
    print("OK")

if __name__ == "__main__":
    main()
'''


def _generate_pdf_with_playwright(html_content: str, output_path: str) -> None:
    """Generate PDF from HTML content using Playwright.

    Runs Playwright in a separate Python process to avoid event loop conflicts on Windows.
    """
    input_data = json.dumps({"html": html_content, "output": output_path})

    result = subprocess.run(
        [sys.executable, "-c", _PDF_SCRIPT],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        logger.error(f"PDF subprocess failed: {result.stderr}")
        raise RuntimeError(f"PDF generation failed: {result.stderr}")

    if "OK" not in result.stdout:
        raise RuntimeError(f"PDF generation failed: {result.stdout} {result.stderr}")


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
    """Read logo image and return as base64 data URI for embedding in HTML."""
    try:
        if LOGO_PATH.exists():
            with open(LOGO_PATH, "rb") as f:
                data = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/jpeg;base64,{data}"
    except Exception as e:
        logger.warning(f"Failed to read logo: {e}")
    return ""


def _esc(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generate_receipt_html(bill: Bill) -> str:
    """Generate bill receipt HTML for PDF rendering via Playwright.

    Uses modern CSS (flexbox) for proper layout and the rupee symbol (₹).
    Optimized for high-resolution print output.
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

    # Build line item rows
    sl = 1
    rows = ""
    if consultation_fee > 0:
        rows += (
            f'<tr>'
            f'<td style="text-align: center;">{sl}</td>'
            f'<td>Consultation Fees</td>'
            f'<td style="text-align: center;">1</td>'
            f'<td style="text-align: right;">₹ {_fmt(consultation_fee)}</td>'
            f'<td style="text-align: right;">₹ {_fmt(consultation_fee)}</td>'
            f'</tr>'
        )
        sl += 1

    for item in lab_items:
        amt = float(item.get("amount", 0))
        rows += (
            f'<tr>'
            f'<td style="text-align: center;">{sl}</td>'
            f'<td>{_esc(item.get("name", "Lab Test"))}</td>'
            f'<td style="text-align: center;">1</td>'
            f'<td style="text-align: right;">₹ {_fmt(amt)}</td>'
            f'<td style="text-align: right;">₹ {_fmt(amt)}</td>'
            f'</tr>'
        )
        sl += 1

    if other_total > 0:
        desc = "Other Charges"
        if other_text:
            desc += f" ({_esc(other_text)})"
        rows += (
            f'<tr>'
            f'<td style="text-align: center;">{sl}</td>'
            f'<td>{desc}</td>'
            f'<td style="text-align: center;">1</td>'
            f'<td style="text-align: right;">₹ {_fmt(other_total)}</td>'
            f'<td style="text-align: right;">₹ {_fmt(other_total)}</td>'
            f'</tr>'
        )

    # Conditional pieces
    pay_ref_html = ""
    if bill.payment_reference:
        pay_ref_html = f'<p><span class="label">REF/TXN ID:</span> {_esc(bill.payment_reference)}</p>'

    pay_ref_info_html = ""
    if bill.payment_reference:
        pay_ref_info_html = f'<p><span class="label">TXN ID:</span> {_esc(bill.payment_reference)}</p>'

    discount_html = ""
    if discount_amount > 0:
        discount_html = f'<p style="color: #22c55e;">DISCOUNT ({discount_percent}%): -₹ {_fmt(discount_amount)}</p>'

    other_charges_html = ""
    if other_total > 0:
        other_charges_html = f'<p>Other Charges: ₹ {_fmt(other_total)}</p>'

    logo_src = _get_logo_base64()
    logo_html = f'<img src="{logo_src}" alt="Balaji Heart Center" class="logo" />' if logo_src else ""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Bill Receipt - {bill.bill_number or 'Receipt'}</title>
<style>
    @page {{
        size: A4;
        margin: 0;
    }}
    * {{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }}
    body {{
        font-family: 'Segoe UI', Arial, sans-serif;
        padding: 20px 30px;
        max-width: 800px;
        margin: 0 auto;
        font-size: 12px;
        color: #222;
        line-height: 1.4;
    }}
    .header {{
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
        border-bottom: 3px solid #0d7377;
        padding-bottom: 15px;
    }}
    .logo {{
        width: 70px;
        height: 70px;
        object-fit: contain;
        flex-shrink: 0;
    }}
    .header-text h1 {{
        color: #0d7377;
        font-size: 24px;
        font-weight: 700;
        margin: 0;
    }}
    .header-text .tagline {{
        color: #a63d40;
        font-weight: bold;
        font-size: 11px;
        margin: 2px 0;
    }}
    .header-text .contact {{
        color: #666;
        font-size: 11px;
        margin: 2px 0;
    }}
    .bill-title {{
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin: 15px 0;
        color: #0d7377;
    }}
    .bill-info {{
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }}
    .bill-info p {{
        margin: 5px 0;
        font-size: 12px;
    }}
    .bill-info .right {{
        text-align: right;
    }}
    .label {{
        color: #a63d40;
        font-weight: bold;
    }}
    table.items {{
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }}
    table.items th,
    table.items td {{
        border: 1px solid #ddd;
        padding: 10px 8px;
        text-align: left;
        font-size: 11px;
    }}
    table.items th {{
        background: #0d7377;
        color: white;
        font-weight: 600;
    }}
    table.items tbody tr:nth-child(even) {{
        background: #f9fafb;
    }}
    .payment-section {{
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        gap: 20px;
    }}
    .payment-left {{
        flex: 1;
    }}
    .payment-left p {{
        margin: 4px 0;
    }}
    .payment-right {{
        flex: 1;
        text-align: right;
    }}
    .payment-right p {{
        margin: 4px 0;
    }}
    .total-row {{
        font-weight: bold;
        font-size: 14px;
    }}
    .net-amount {{
        font-size: 16px;
        font-weight: bold;
        color: #0d7377;
    }}
    .due-amount {{
        font-weight: bold;
        font-size: 14px;
        color: #a63d40;
    }}
    .amount-words {{
        margin: 20px 0;
        padding: 12px 15px;
        background: #f0f7f7;
        border-left: 4px solid #0d7377;
        font-size: 11px;
    }}
    .amount-words p {{
        margin: 3px 0;
    }}
    .signature {{
        text-align: right;
        margin-top: 40px;
        padding-top: 20px;
    }}
    .signature-line {{
        border-top: 1px solid #000;
        width: 180px;
        margin-left: auto;
        padding-top: 8px;
        text-align: center;
        font-size: 11px;
    }}
    .footer {{
        text-align: center;
        margin-top: 30px;
        padding-top: 15px;
        border-top: 2px solid #0d7377;
        color: #666;
        font-size: 11px;
    }}
    .footer p {{
        margin: 3px 0;
    }}
</style>
</head>
<body>

<div class="header">
    {logo_html}
    <div class="header-text">
        <h1>BALAJI HEART CENTER</h1>
        <p class="tagline">YES, THE 'ADVANTAGE' HEART CLINIC!</p>
        <p class="contact">SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>
        <p class="contact">Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>
    </div>
</div>

<div class="bill-title">BILL RECEIPT</div>

<div class="bill-info">
    <div class="left">
        <p><span class="label">BILL NO:</span> {bill.bill_number or '-'}</p>
        <p><span class="label">MR NO:</span> {bill.uhid or '-'}</p>
        <p><span class="label">PATIENT:</span> {_esc(bill.patient_name) or '-'}</p>
        <p><span class="label">MOBILE:</span> {bill.mobile_no or '-'}</p>
    </div>
    <div class="right">
        <p><span class="label">DATE:</span> {_format_date(bill.created_at)}</p>
        <p><span class="label">TIME:</span> {_format_time(bill.created_at)}</p>
        <p><span class="label">DOCTOR:</span> {_esc(bill.doctor_name) or '-'}</p>
        {pay_ref_info_html}
    </div>
</div>

<table class="items">
    <thead>
        <tr>
            <th style="width: 60px; text-align: center;">SL NO</th>
            <th>SERVICE NAME</th>
            <th style="width: 60px; text-align: center;">QTY</th>
            <th style="width: 100px; text-align: right;">RATE</th>
            <th style="width: 120px; text-align: right;">NET AMOUNT</th>
        </tr>
    </thead>
    <tbody>
        {rows}
    </tbody>
</table>

<div class="payment-section">
    <div class="payment-left">
        <p><span class="label">PAYMENT DETAILS</span></p>
        <p><span class="label">PAY MODE:</span> {pay_method}</p>
        <p><span class="label">PAID AMOUNT:</span> ₹ {_fmt(paid_amount)}</p>
        {pay_ref_html}
    </div>
    <div class="payment-right">
        <p>Consultation: ₹ {_fmt(consultation_fee)}</p>
        <p>Lab Total: ₹ {_fmt(lab_total)}</p>
        {other_charges_html}
        <p class="total-row">TOTAL AMOUNT: ₹ {_fmt(pre_discount)}</p>
        {discount_html}
        <p class="net-amount">NET AMOUNT: ₹ {_fmt(total_amount)}</p>
        <p class="due-amount">DUE: ₹ {_fmt(due_amount)}</p>
    </div>
</div>

<div class="amount-words">
    <p>RECEIVED WITH THANKS A SUM OF ₹ {_fmt(paid_amount)} ONLY</p>
    <p>AMOUNT IN WORDS: {_number_to_words(paid_amount)} RUPEES ONLY</p>
</div>

<div class="signature">
    <div class="signature-line">Authorised Signatory</div>
</div>

<div class="footer">
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
    """Generate day payment summary HTML for PDF rendering via Playwright.

    Uses modern CSS (flexbox, grid) for proper layout.
    Mirrors the frontend DayPayments print template with high-resolution output.
    """
    from datetime import datetime as dt

    logo_src = _get_logo_base64()
    logo_html = f'<img src="{logo_src}" class="logo" alt="Balaji Heart Center" />' if logo_src else ""

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
        row_class = "even" if idx % 2 == 0 else ""
        rows += (
            f'<tr class="{row_class}">'
            f'<td style="text-align: center;">{bill_time}</td>'
            f'<td>{_esc(b.get("bill_number", "-"))}</td>'
            f'<td>{_esc(b.get("patient_name", "-"))}</td>'
            f'<td>{_esc(b.get("uhid", "-"))}</td>'
            f'<td style="text-align: center;">{method}</td>'
            f'<td style="text-align: right; font-weight: bold;">₹ {_fmt(b.get("paid_amount", 0))}</td>'
            f'</tr>'
        )

    if not bills:
        rows = (
            '<tr><td colspan="6" class="no-data">'
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
        margin: 0;
    }}
    * {{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }}
    body {{
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 12px;
        color: #222;
        padding: 25px 35px;
        line-height: 1.4;
    }}
    .header {{
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        border-bottom: 2px solid #8B0000;
        padding-bottom: 12px;
    }}
    .logo {{
        width: 70px;
        height: 70px;
        object-fit: contain;
        flex-shrink: 0;
    }}
    .header-text h1 {{
        font-size: 22px;
        color: #1a365d;
        font-weight: 700;
        margin: 0;
    }}
    .header-text .tagline {{
        color: #8B0000;
        font-weight: bold;
        font-size: 10px;
        margin: 2px 0;
    }}
    .header-text .contact {{
        color: #555;
        font-size: 10px;
        margin: 1px 0;
    }}
    .section-title {{
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: #1a365d;
        padding: 12px 0 4px 0;
    }}
    .date-line {{
        text-align: center;
        font-size: 13px;
        color: #444;
        margin-bottom: 20px;
    }}
    .summary-cards {{
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
    }}
    .summary-card {{
        flex: 1;
        border: 2px solid #ccc;
        border-radius: 10px;
        padding: 18px 12px;
        text-align: center;
    }}
    .summary-card.cash {{
        border-color: #22c55e;
        background: linear-gradient(to bottom, #f0fdf4, #dcfce7);
    }}
    .summary-card.card-pay {{
        border-color: #3b82f6;
        background: linear-gradient(to bottom, #eff6ff, #dbeafe);
    }}
    .summary-card.upi {{
        border-color: #a855f7;
        background: linear-gradient(to bottom, #faf5ff, #f3e8ff);
    }}
    .amount-text {{
        font-size: 26px;
        font-weight: bold;
        margin-bottom: 6px;
    }}
    .amount-label {{
        font-size: 11px;
        color: #555;
    }}
    .cash .amount-text {{ color: #16a34a; }}
    .card-pay .amount-text {{ color: #2563eb; }}
    .upi .amount-text {{ color: #9333ea; }}
    .total-card {{
        background: #1a365d;
        color: white;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        margin-bottom: 25px;
    }}
    .total-label {{
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 4px;
    }}
    .total-amount {{
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 4px;
    }}
    .total-count {{
        font-size: 11px;
        opacity: 0.8;
    }}
    table.items {{
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }}
    table.items th {{
        background: #1a365d;
        color: white;
        padding: 10px 8px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
    }}
    table.items td {{
        border-bottom: 1px solid #e2e8f0;
        padding: 10px 8px;
        font-size: 11px;
    }}
    table.items tr.even {{
        background: #f8fafc;
    }}
    table.items .no-data {{
        text-align: center;
        padding: 25px;
        color: #888;
    }}
    .footer {{
        border-top: 2px solid #1a365d;
        text-align: center;
        color: #666;
        font-size: 10px;
        padding-top: 12px;
        margin-top: 20px;
    }}
    .footer p {{
        margin: 3px 0;
    }}
</style>
</head>
<body>

<div class="header">
    {logo_html}
    <div class="header-text">
        <h1>BALAJI HEART CENTER</h1>
        <p class="tagline">YES, THE 'ADVANTAGE' HEART CLINIC!</p>
        <p class="contact">SVL Towers, Ground Floor, Chanda Nagar, Hyderabad - 500 050</p>
        <p class="contact">Ph: +91 9100079990 | Email: balajiheartcenter.hyd@gmail.com</p>
    </div>
</div>

<div class="section-title">DAY PAYMENTS SUMMARY</div>
<div class="date-line">Date: {_esc(summary_date)}</div>

<div class="summary-cards">
    <div class="summary-card cash">
        <div class="amount-text">₹ {_fmt(cash_total)}</div>
        <div class="amount-label">Cash Collection</div>
    </div>
    <div class="summary-card card-pay">
        <div class="amount-text">₹ {_fmt(card_total)}</div>
        <div class="amount-label">Card Collection</div>
    </div>
    <div class="summary-card upi">
        <div class="amount-text">₹ {_fmt(upi_total)}</div>
        <div class="amount-label">UPI Collection</div>
    </div>
</div>

<div class="total-card">
    <div class="total-label">Total Collection</div>
    <div class="total-amount">₹ {_fmt(grand_total)}</div>
    <div class="total-count">{total_transactions} Transaction{'s' if total_transactions != 1 else ''}</div>
</div>

<table class="items">
    <thead>
        <tr>
            <th style="width: 70px; text-align: center;">TIME</th>
            <th style="width: 120px;">BILL NO</th>
            <th>PATIENT</th>
            <th style="width: 90px;">MR NO</th>
            <th style="width: 70px; text-align: center;">METHOD</th>
            <th style="width: 100px; text-align: right;">AMOUNT</th>
        </tr>
    </thead>
    <tbody>
        {rows}
    </tbody>
</table>

<div class="footer">
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

    Uses Playwright for high-resolution PDF generation with modern CSS support.
    The caller is responsible for deleting the file after use.
    """
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
    os.close(fd)  # Close the file descriptor, Playwright will create the file

    try:
        logger.info(f"Generating day summary PDF for {summary_date}")
        _generate_pdf_with_playwright(html, pdf_path)
        logger.info(f"Day summary PDF generated: {pdf_path}")
    except Exception as e:
        logger.error(f"Day summary PDF generation failed: {e}")
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    return pdf_path


def generate_receipt_pdf(bill: Bill) -> str:
    """Generate bill receipt PDF and return the temp file path.

    Uses Playwright for high-resolution PDF generation with modern CSS support.
    The caller is responsible for deleting the file after use.
    """
    html = generate_receipt_html(bill)

    fd, pdf_path = tempfile.mkstemp(
        suffix=".pdf",
        prefix=f"receipt_{bill.bill_number}_",
    )
    os.close(fd)  # Close the file descriptor, Playwright will create the file

    try:
        logger.info(f"Generating receipt PDF for bill {bill.bill_number}")
        _generate_pdf_with_playwright(html, pdf_path)
        logger.info(f"Receipt PDF generated: {pdf_path}")
    except Exception as e:
        logger.error(f"Receipt PDF generation failed: {e}")
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    return pdf_path
