"""
Prescription Generator - Generates prescription HTML and PDF.

Mirrors the frontend print template from PrescriptionForm.tsx.
Uses table-based layout for xhtml2pdf compatibility (no flexbox support).
Uses header/footer images matching the clinic stationery.
"""

import base64
import os
import logging
import traceback
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from app.models.prescription import Prescription
from app.models.vitals import PatientVitals

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).parent.parent.parent / "assets"
HEADER_PATH = ASSETS_DIR / "prescription-header.jpeg"
FOOTER_PATH = ASSETS_DIR / "prescription-footer.jpeg"
PRESCRIPTIONS_DIR = Path(__file__).parent.parent.parent / "uploads" / "prescriptions"


def _esc(text) -> str:
    """HTML-escape text."""
    return (str(text) if text else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _nl2br(text) -> str:
    """Convert newlines to <br/> tags after escaping."""
    return _esc(text).replace("\n", "<br/>")


def _get_image_base64(path: Path) -> str:
    """Read an image file and return base64 data URI."""
    try:
        if path.exists():
            with open(path, "rb") as f:
                data = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/jpeg;base64,{data}"
    except Exception as e:
        logger.warning(f"Failed to read image {path}: {e}")
    return ""


def _format_date(dt=None) -> str:
    """Format date as DD-MM-YYYY."""
    d = dt or datetime.now()
    if isinstance(d, str):
        return d
    return d.strftime("%d-%m-%Y")


def _calculate_age(dob) -> str:
    """Calculate age from date of birth."""
    if not dob:
        return "-"
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return str(age)


def generate_prescription_html(
    prescription: Prescription,
    vitals: Optional[PatientVitals] = None,
) -> str:
    """Generate prescription HTML for PDF rendering via xhtml2pdf.

    Uses flat table layout (no thead/tfoot - xhtml2pdf has limited support).
    Matches the frontend PrescriptionForm.tsx print layout.
    """
    patient = prescription.patient
    appointment = prescription.appointment

    # Patient details - safely handle None
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "-"
    mr_number = patient.mr_number if patient else "-"
    gender = patient.gender.value if patient and patient.gender else "-"
    age = _calculate_age(patient.date_of_birth) if patient else "-"
    phone = patient.phone if patient else "-"
    op_number = appointment.op_number if appointment and appointment.op_number else "-"
    weight = f"{vitals.weight} Kg's" if vitals and vitals.weight else "-"
    rx_date = _format_date(prescription.created_at)

    # Build treatment text from medicines
    treatment_lines = []
    if prescription.medicines:
        sorted_meds = sorted(
            [m for m in prescription.medicines if not m.is_deleted],
            key=lambda x: x.sequence_order,
        )
        for m in sorted_meds:
            line = _esc(m.medicine_name)
            if m.frequency:
                line += f" ({_esc(m.frequency)})"
            if m.duration:
                line += f" - {_esc(m.duration)}"
            treatment_lines.append(line)
    treatment_text = "<br/>".join(treatment_lines) if treatment_lines else "-"

    # Vitals display - safely handle None
    spo2 = f"{vitals.spo2} %" if vitals and vitals.spo2 else "%"
    pulse = f"{vitals.pulse} mm/mt" if vitals and vitals.pulse else "mm/mt"
    cvs = _esc(vitals.cvs) if vitals and vitals.cvs else ""
    rs = _esc(vitals.rs) if vitals and vitals.rs else ""
    jvp = _esc(vitals.jvp) if vitals and vitals.jvp else ""
    bp = _esc(vitals.blood_pressure) if vitals and vitals.blood_pressure else ""
    htn = _esc(vitals.htn) if vitals and vitals.htn else "-"
    dm = _esc(vitals.dm) if vitals and vitals.dm else "-"
    smoking = _esc(vitals.smoking) if vitals and vitals.smoking else "-"
    hlp = _esc(vitals.hlp) if vitals and vitals.hlp else ""
    family_ho_cad = _esc(vitals.family_ho_cad) if vitals and vitals.family_ho_cad else ""
    heart_disease = _esc(vitals.heart_disease) if vitals and vitals.heart_disease else ""
    ptca_cabg = _esc(vitals.ptca_cabg) if vitals and vitals.ptca_cabg else ""
    current_drugs = _esc(vitals.current_drugs) if vitals and vitals.current_drugs else ""

    # Header/footer images as base64
    header_src = _get_image_base64(HEADER_PATH)
    footer_src = _get_image_base64(FOOTER_PATH)

    # Build header/footer HTML - use simple img tags, no thead/tfoot
    header_html = f'<img src="{header_src}" width="100%" />' if header_src else ""
    footer_html = f'<img src="{footer_src}" width="100%" />' if footer_src else ""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Prescription - {_esc(patient_name)}</title>
<style>
    @page {{
        size: A4;
        margin: 0;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 13px;
        color: #222;
        margin: 0;
        padding: 0;
    }}
    p {{
        margin: 0;
    }}

    .content-area {{
        padding: 20px 30px 10px 30px;
    }}

    /* Patient Info Table */
    .patient-info-table {{
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #bbb;
        margin-bottom: 20px;
    }}
    .patient-info-table td {{
        padding: 8px 12px;
        border: 1px solid #ddd;
        vertical-align: top;
    }}
    .pi-label {{
        color: #8B0000;
        font-size: 11px;
        font-weight: bold;
    }}
    .pi-value {{
        font-size: 14px;
        font-weight: bold;
    }}

    /* Two Column Layout */
    .two-col-table {{
        width: 100%;
        border-collapse: collapse;
    }}
    .two-col-table td {{
        vertical-align: top;
        padding: 0;
    }}
    .col-vitals {{
        width: 220px;
        padding-right: 15px;
    }}
    .col-prescription {{
        padding-left: 15px;
        border-left: 1px solid #ddd;
    }}

    /* Vitals List */
    .vitals-list {{
        width: 100%;
        border-collapse: collapse;
    }}
    .vitals-list td {{
        padding: 3px 0;
        vertical-align: top;
        font-size: 13px;
    }}
    .vl-label {{
        font-weight: bold;
        color: #333;
        padding-right: 8px;
        width: 110px;
    }}
    .vl-value {{
        color: #444;
    }}

    /* Prescription Sections */
    .rx-title {{
        font-size: 13px;
        font-weight: bold;
        color: #333;
        padding-top: 10px;
        padding-bottom: 3px;
    }}
    .rx-content {{
        font-size: 13px;
        color: #444;
        line-height: 1.5;
        padding-bottom: 6px;
    }}
</style>
</head>
<body>

<!-- HEADER IMAGE -->
{header_html}

<!-- CONTENT -->
<div class="content-area">

    <!-- Patient Info -->
    <table class="patient-info-table">
        <tr>
            <td>
                <span class="pi-label">MR. No:</span><br/>
                <span class="pi-value">{_esc(mr_number)}</span>
            </td>
            <td>
                <span class="pi-label">DATE:</span><br/>
                <span class="pi-value">{rx_date}</span>
            </td>
            <td>
                <span class="pi-label">Patient Name:</span><br/>
                <span class="pi-value">{_esc(patient_name)}</span>
            </td>
            <td>
                <span class="pi-label">Gender/Age:</span><br/>
                <span class="pi-value">{_esc(gender)} / {age}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="pi-label">OP No:</span><br/>
                <span class="pi-value">{_esc(op_number)}</span>
            </td>
            <td>
                <span class="pi-label">Weight:</span><br/>
                <span class="pi-value">{weight}</span>
            </td>
            <td>
                <span class="pi-label">Mobile No:</span><br/>
                <span class="pi-value">{_esc(phone)}</span>
            </td>
            <td></td>
        </tr>
    </table>

    <!-- Two Column: Vitals Left | Prescription Right -->
    <table class="two-col-table">
        <tr>
            <!-- LEFT: Vitals -->
            <td class="col-vitals">
                <table class="vitals-list">
                    <tr><td class="vl-label">SPO2:</td><td class="vl-value">{spo2}</td></tr>
                    <tr><td class="vl-label">PR:</td><td class="vl-value">{pulse}</td></tr>
                    <tr><td class="vl-label">CVS:</td><td class="vl-value">{cvs}</td></tr>
                    <tr><td class="vl-label">RS:</td><td class="vl-value">{rs}</td></tr>
                    <tr><td class="vl-label">JVP:</td><td class="vl-value">{jvp}</td></tr>
                    <tr><td class="vl-label">BP:</td><td class="vl-value">{bp}</td></tr>
                    <tr><td class="vl-label">HTN:</td><td class="vl-value">{htn}</td></tr>
                    <tr><td class="vl-label">DM:</td><td class="vl-value">{dm}</td></tr>
                    <tr><td class="vl-label">SMOKING:</td><td class="vl-value">{smoking}</td></tr>
                    <tr><td class="vl-label">THYROID:</td><td class="vl-value"></td></tr>
                    <tr><td class="vl-label">HLP:</td><td class="vl-value">{hlp}</td></tr>
                    <tr><td class="vl-label">F H/O CAD:</td><td class="vl-value">{family_ho_cad}</td></tr>
                    <tr><td class="vl-label">HEART DISEASE:</td><td class="vl-value">{heart_disease}</td></tr>
                    <tr><td class="vl-label">PTCA/CABG:</td><td class="vl-value">{ptca_cabg}</td></tr>
                    <tr><td class="vl-label">DRUGS:</td><td class="vl-value">{current_drugs}</td></tr>
                </table>
            </td>

            <!-- RIGHT: Prescription -->
            <td class="col-prescription">
                <p class="rx-title">Complaint:</p>
                <p class="rx-content">{_nl2br(prescription.complaint) if prescription.complaint else '-'}</p>

                <p class="rx-title">History:</p>
                <p class="rx-content">{_nl2br(prescription.history) if prescription.history and prescription.history != 'NULL' else '-'}</p>

                <p class="rx-title">Treatment:</p>
                <p class="rx-content">{treatment_text}</p>

                <p class="rx-title">Diagnosis:</p>
                <p class="rx-content">{_nl2br(prescription.diagnosis) if prescription.diagnosis else '-'}</p>

                <p class="rx-title">Advice:</p>
                <p class="rx-content">{_nl2br(prescription.advice) if prescription.advice else '-'}</p>

                <p class="rx-title">Lab/Investigation:</p>
                <p class="rx-content">{_nl2br(prescription.lab_tests) if prescription.lab_tests else '-'}</p>
            </td>
        </tr>
    </table>

</div>

<!-- FOOTER IMAGE -->
{footer_html}

</body>
</html>"""

    return html


def generate_prescription_pdf(
    prescription: Prescription,
    vitals: Optional[PatientVitals] = None,
) -> str:
    """Generate prescription PDF and store in uploads/prescriptions/ folder.

    Returns the stored PDF file path.
    """
    from xhtml2pdf import pisa

    html = generate_prescription_html(prescription, vitals)

    # Ensure prescriptions directory exists
    PRESCRIPTIONS_DIR.mkdir(parents=True, exist_ok=True)

    # Build filename using OP number or prescription ID
    op_number = None
    if prescription.appointment and prescription.appointment.op_number:
        op_number = prescription.appointment.op_number

    if op_number:
        filename = f"{op_number}.pdf"
    else:
        filename = f"{prescription.id}.pdf"

    pdf_path = str(PRESCRIPTIONS_DIR / filename)

    logger.info(f"Generating prescription PDF: {filename}")

    try:
        with open(pdf_path, "wb") as f:
            result = pisa.CreatePDF(html, dest=f)
            if result.err:
                logger.error(f"xhtml2pdf reported {result.err} errors for {filename}")
                raise RuntimeError(
                    f"PDF generation failed for prescription {prescription.id}"
                )
    except Exception as e:
        logger.error(f"PDF generation error: {e}\n{traceback.format_exc()}")
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    logger.info(f"Prescription PDF stored at: {pdf_path}")
    return pdf_path
