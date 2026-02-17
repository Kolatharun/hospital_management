"""
Prescription Generator - Generates prescription HTML and PDF.

Mirrors the frontend print template from PrescriptionForm.tsx EXACTLY.
Uses table-based layout for xhtml2pdf compatibility (no flexbox/grid support).
Matches: header, patient info box, vitals sidebar, prescription content, footer.
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
LOGO_PATH = ASSETS_DIR / "logo.jpeg"
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
    is_old_vitals: bool = False,
    source_op_number: Optional[str] = None,
    visit_date: Optional[str] = None,
) -> str:
    """Generate prescription HTML for PDF rendering via xhtml2pdf.

    Uses table-based layout matching the frontend PrescriptionForm.tsx print layout EXACTLY.
    All flexbox/grid replaced with tables for xhtml2pdf compatibility.

    Args:
        prescription: The prescription model
        vitals: The vitals model (current or fallback from previous visit)
        is_old_vitals: True if vitals are from a previous visit
        source_op_number: The OP number from which old vitals were taken
        visit_date: The date of the previous visit (ISO format)
    """
    patient = prescription.patient
    appointment = prescription.appointment
    doctor = prescription.doctor

    # Doctor details from prescription's doctor relationship
    doctor_name = doctor.name if doctor else "Doctor"
    doctor_qualification = doctor.qualification if doctor else ""
    doctor_registration = doctor.registration_number if doctor else ""
    doctor_speciality = doctor.speciality if doctor else ""
    doctor_phone = doctor.phone if doctor else ""

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

    # Vitals display - safely handle None (match frontend format)
    spo2 = f"{vitals.spo2}%" if vitals and vitals.spo2 else ""
    pulse = f"{vitals.pulse} mm/mt" if vitals and vitals.pulse else ""
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

    # Logo image as base64
    logo_src = _get_image_base64(LOGO_PATH)

    # Vitals section heading based on fallback status
    vitals_heading_color = "#b45309" if is_old_vitals else "#8B0000"
    vitals_heading_text = "Old Vitals (From Previous Visit)" if is_old_vitals else "Clinical Parameters"
    vitals_source_html = ""
    if is_old_vitals and source_op_number:
        visit_date_str = ""
        if visit_date:
            try:
                from datetime import datetime as dt
                parsed_date = dt.fromisoformat(visit_date.replace("Z", "+00:00"))
                visit_date_str = f" ({parsed_date.strftime('%d-%m-%Y')})"
            except Exception:
                visit_date_str = f" ({visit_date})"
        vitals_source_html = f'<br/><span style="font-size: 9px; color: #92400e;">From: {_esc(source_op_number)}{visit_date_str}</span>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Prescription - {_esc(patient_name)}</title>
<style>
@page {{
    size: A4;
    margin: 10mm 12mm 10mm 12mm;
}}
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}
body {{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #222;
    background: #fff;
    line-height: 1.3;
}}
table {{
    border-collapse: collapse;
    border-spacing: 0;
}}

/* Header */
.header-section {{
    padding-bottom: 8px;
    margin-bottom: 10px;
}}
.tagline {{
    text-align: center;
    color: #8B0000;
    font-size: 10px;
    font-style: italic;
    margin-bottom: 8px;
}}
.header-table {{
    width: 510px;
    table-layout: fixed;
}}
.header-table td {{
    vertical-align: top;
    border: none;
}}
.dr-info-cell {{
    width: 360px;
}}
.logo-cell {{
    width: 150px;
    text-align: right;
}}
.dr-name {{
    color: #8B0000;
    font-size: 16px;
    font-weight: bold;
    white-space: nowrap;
}}
.dr-degree {{
    color: #444;
    font-size: 9px;
    white-space: nowrap;
}}
.dr-title {{
    color: #8B0000;
    font-size: 11px;
    font-weight: bold;
    margin-top: 2px;
    white-space: nowrap;
}}
.dr-hospital {{
    color: #0066cc;
    font-size: 9px;
    white-space: nowrap;
}}
.dr-contact {{
    color: #0066cc;
    font-size: 8px;
    white-space: nowrap;
}}
.logo-img {{
    width: 130px;
    height: 70px;
}}
.header-line {{
    border-top: 2px solid #8B0000;
    margin-top: 6px;
}}

/* Patient Info Box */
.patient-box {{
    border: 1px solid #ccc;
    margin-bottom: 12px;
    width: 510px;
}}
.patient-table {{
    width: 510px;
    table-layout: fixed;
}}
.patient-table td {{
    padding: 6px 8px;
    vertical-align: top;
    border: none;
    overflow: hidden;
}}
.p-label {{
    color: #8B0000;
    font-size: 9px;
    font-weight: bold;
    white-space: nowrap;
}}
.p-value {{
    font-size: 11px;
    font-weight: bold;
    color: #000;
    white-space: nowrap;
}}

/* Main Layout */
.main-table {{
    width: 510px;
    table-layout: fixed;
}}
.main-table td {{
    vertical-align: top;
    border: none;
}}
.vitals-col {{
    width: 130px;
    padding-right: 10px;
}}
.rx-col {{
    width: 380px;
    padding-left: 10px;
    border-left: 1px solid #ddd;
}}

/* Vitals */
.vitals-title {{
    font-size: 10px;
    font-weight: bold;
    color: #8B0000;
    padding-bottom: 4px;
    margin-bottom: 6px;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
}}
.vitals-table {{
    width: 120px;
    table-layout: fixed;
}}
.vitals-table td {{
    padding: 2px 0;
    font-size: 10px;
    border: none;
    vertical-align: top;
}}
.vitals-table .vl {{
    font-weight: bold;
    color: #000;
    width: 75px;
    white-space: nowrap;
}}
.vitals-table .vv {{
    color: #333;
    width: 45px;
}}

/* Prescription */
.rx-section {{
    margin-bottom: 10px;
}}
.rx-title {{
    font-weight: bold;
    font-size: 11px;
    color: #000;
    margin-bottom: 2px;
}}
.rx-value {{
    font-size: 11px;
    color: #333;
    line-height: 1.4;
}}

/* Footer */
.footer-section {{
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    text-align: center;
    width: 510px;
}}
.services {{
    color: #0066cc;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 6px;
}}
.timings {{
    font-size: 10px;
    color: #333;
    margin-bottom: 5px;
}}
.timings b {{
    color: #8B0000;
}}
.medicover {{
    font-size: 10px;
    margin-bottom: 5px;
}}
.medicover .heart {{
    color: #8B0000;
}}
.medicover .name {{
    color: #8B0000;
    font-weight: bold;
}}
.medicover .hosp {{
    color: #666;
}}
.address {{
    font-size: 9px;
    color: #666;
    margin-bottom: 5px;
}}
.contact {{
    font-size: 10px;
    font-weight: bold;
    color: #000;
}}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header-section">
    <div class="tagline">30 Years Experience in Treating BP and Heart Diseases</div>
    <table class="header-table">
        <tr>
            <td class="dr-info-cell">
                <div class="dr-name">{_esc(doctor_name)}</div>
                <div class="dr-degree">{_esc(doctor_qualification)}</div>
                <div class="dr-degree">Regd No: {_esc(doctor_registration)}</div>
                <div class="dr-title">{_esc(doctor_speciality)}</div>
                <div class="dr-hospital">Medicover Hospitals - Hitech City</div>
                <div class="dr-contact">Tel: {_esc(doctor_phone)}</div>
                <div class="dr-contact">www.balajiheartcenter.com</div>
                <div class="dr-contact">www.facebook.com/balajiheartcenter</div>
            </td>
            <td class="logo-cell">
                {"<img src='" + logo_src + "' class='logo-img'/>" if logo_src else ""}
            </td>
        </tr>
    </table>
    <div class="header-line"></div>
</div>

<!-- PATIENT INFO -->
<div class="patient-box">
    <table class="patient-table">
        <col width="115"/>
        <col width="100"/>
        <col width="175"/>
        <col width="120"/>
        <tr>
            <td><span class="p-label">MR. No:</span><br/><span class="p-value">{_esc(mr_number)}</span></td>
            <td><span class="p-label">DATE:</span><br/><span class="p-value">{rx_date}</span></td>
            <td><span class="p-label">Patient Name:</span><br/><span class="p-value">{_esc(patient_name)}</span></td>
            <td><span class="p-label">Gender/Age:</span><br/><span class="p-value">{_esc(gender)} / {age}</span></td>
        </tr>
        <tr>
            <td style="border-top:1px solid #eee;"><span class="p-label">OP No:</span><br/><span class="p-value">{_esc(op_number)}</span></td>
            <td style="border-top:1px solid #eee;"><span class="p-label">Weight:</span><br/><span class="p-value">{weight}</span></td>
            <td style="border-top:1px solid #eee;"><span class="p-label">Mobile No:</span><br/><span class="p-value">{_esc(phone)}</span></td>
            <td style="border-top:1px solid #eee;"></td>
        </tr>
    </table>
</div>

<!-- MAIN: Vitals + Prescription -->
<table class="main-table">
    <col width="130"/>
    <col width="380"/>
    <tr>
        <td class="vitals-col">
            <div class="vitals-title" style="color:{vitals_heading_color};">{vitals_heading_text}{vitals_source_html}</div>
            <table class="vitals-table">
                <col width="75"/>
                <col width="45"/>
                <tr><td class="vl">SPO2:</td><td class="vv">{spo2}</td></tr>
                <tr><td class="vl">PR:</td><td class="vv">{pulse}</td></tr>
                <tr><td class="vl">CVS:</td><td class="vv">{cvs}</td></tr>
                <tr><td class="vl">RS:</td><td class="vv">{rs}</td></tr>
                <tr><td class="vl">JVP:</td><td class="vv">{jvp}</td></tr>
                <tr><td class="vl">BP:</td><td class="vv">{bp}</td></tr>
                <tr><td class="vl">HTN:</td><td class="vv">{htn}</td></tr>
                <tr><td class="vl">DM:</td><td class="vv">{dm}</td></tr>
                <tr><td class="vl">SMOKING:</td><td class="vv">{smoking}</td></tr>
                <tr><td class="vl">THYROID:</td><td class="vv"></td></tr>
                <tr><td class="vl">HLP:</td><td class="vv">{hlp}</td></tr>
                <tr><td class="vl">F H/O CAD:</td><td class="vv">{family_ho_cad}</td></tr>
                <tr><td class="vl">HEART DISEASE:</td><td class="vv">{heart_disease}</td></tr>
                <tr><td class="vl">PTCA/CABG:</td><td class="vv">{ptca_cabg}</td></tr>
                <tr><td class="vl">DRUGS:</td><td class="vv">{current_drugs}</td></tr>
            </table>
        </td>
        <td class="rx-col">
            <div class="rx-section"><div class="rx-title">Complaint:</div><div class="rx-value">{_nl2br(prescription.complaint) if prescription.complaint else '-'}</div></div>
            <div class="rx-section"><div class="rx-title">History:</div><div class="rx-value">{_nl2br(prescription.history) if prescription.history and prescription.history != 'NULL' else '-'}</div></div>
            <div class="rx-section"><div class="rx-title">Treatment:</div><div class="rx-value">{treatment_text}</div></div>
            <div class="rx-section"><div class="rx-title">Diagnosis:</div><div class="rx-value">{_nl2br(prescription.diagnosis) if prescription.diagnosis else '-'}</div></div>
            <div class="rx-section"><div class="rx-title">Advice:</div><div class="rx-value">{_nl2br(prescription.advice) if prescription.advice else '-'}</div></div>
            <div class="rx-section"><div class="rx-title">Lab/Investigation:</div><div class="rx-value">{_nl2br(prescription.lab_tests) if prescription.lab_tests else '-'}</div></div>
        </td>
    </tr>
</table>

<!-- FOOTER -->
<div class="footer-section">
    <div class="services">ECG &nbsp; ECHO &nbsp; TMT &nbsp; HOLTER &nbsp; ABPM</div>
    <div class="timings"><b>Chanda Nagar :</b> Morning : 8.30 am to 10.30 am, <b>Evening</b> 6.30 pm to 9.30 pm</div>
    <div class="medicover"><span class="heart">&#9829;</span> <span class="name">MEDICOVER</span> <span class="hosp">HOSPITALS Hitech City</span></div>
    <div class="address">SVL Towers, Ground Floor, Opp. Anu Furniture, Beside Narayana Junior Collage, Chanda Nagar<br/>Hyderabad - 500 050, Telangana Email: balajiheartcenter.hyd@gmail.com</div>
    <div class="contact">For Appointment: +91 9100079990 / 9010278278 / 040-2303 2345</div>
</div>

</body>
</html>"""

    return html


def generate_prescription_pdf(
    prescription: Prescription,
    vitals: Optional[PatientVitals] = None,
    is_old_vitals: bool = False,
    source_op_number: Optional[str] = None,
    visit_date: Optional[str] = None,
) -> str:
    """Generate prescription PDF and store in uploads/prescriptions/ folder.

    Returns the stored PDF file path.

    Args:
        prescription: The prescription model
        vitals: The vitals model (current or fallback from previous visit)
        is_old_vitals: True if vitals are from a previous visit
        source_op_number: The OP number from which old vitals were taken
        visit_date: The date of the previous visit (ISO format)
    """
    from xhtml2pdf import pisa

    html = generate_prescription_html(
        prescription,
        vitals,
        is_old_vitals=is_old_vitals,
        source_op_number=source_op_number,
        visit_date=visit_date,
    )

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
