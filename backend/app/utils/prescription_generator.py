"""
Prescription Generator - Generates prescription HTML and PDF.

Uses the EXACT same HTML/CSS template as the frontend PrescriptionForm.tsx.
Playwright is used for PDF generation as it supports modern CSS (flexbox, grid).
This ensures 100% layout match between browser Print and generated PDF.
"""

import base64
import json
import logging
import os
import subprocess
import sys
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
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            print_background=True,
        )
        browser.close()
    print("OK")

if __name__ == "__main__":
    main()
'''


def generate_prescription(html_content: str, output_path: str) -> None:
    """Generate PDF from HTML content using Playwright.

    Synchronous wrapper for PDF generation that works safely in a normal Python backend.
    Runs Playwright in a separate Python process to avoid event loop conflicts on Windows.

    Args:
        html_content: The HTML string to render
        output_path: The output PDF file path
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


def generate_prescription_html(
    prescription: Prescription,
    vitals: Optional[PatientVitals] = None,
    is_old_vitals: bool = False,
    source_op_number: Optional[str] = None,
    visit_date: Optional[str] = None,
) -> str:
    """Generate prescription HTML for PDF rendering.

    Uses the EXACT same HTML/CSS as frontend PrescriptionForm.tsx buildPrescriptionHTML().
    This ensures 100% layout match between browser print and PDF.

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
    treatment_text = "\n".join(treatment_lines) if treatment_lines else "-"

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

    # Vitals section heading based on fallback status (match frontend exactly)
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

    # Vitals header section - only show if vitals exist
    vitals_header_html = ""
    if vitals:
        vitals_header_html = f'''
            <div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-size: 11px; font-weight: 700; color: {vitals_heading_color};">
                {vitals_heading_text}
              </span>
              {vitals_source_html}
            </div>
        '''

    # PDF filename using OP number
    pdf_filename = f"{op_number}.pdf" if op_number != "-" else f"{prescription.id}.pdf"

    # Escape prescription content
    complaint = _esc(prescription.complaint) if prescription.complaint else "-"
    history = _esc(prescription.history) if prescription.history and prescription.history != "NULL" else "-"
    diagnosis = _esc(prescription.diagnosis) if prescription.diagnosis else "-"
    advice = _esc(prescription.advice) if prescription.advice else "-"
    lab_tests = _esc(prescription.lab_tests) if prescription.lab_tests else "-"

    # Build qualification/registration line exactly like frontend
    dr_degree_parts = []
    if doctor_qualification:
        dr_degree_parts.append(_esc(doctor_qualification))
    if doctor_registration:
        dr_degree_parts.append(f"Regd No: {_esc(doctor_registration)}")
    dr_degree = " | ".join(dr_degree_parts)

    # EXACT same HTML/CSS as frontend PrescriptionForm.tsx buildPrescriptionHTML()
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{pdf_filename}</title>
  <style>
    @page {{
      size: A4;
      margin: 0;
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    body {{
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #222;
      background: #fff;
      line-height: 1.4;
    }}

    /* Repeating Header/Footer structure */
    table.print-container {{
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }}
    thead {{ display: table-header-group; }}
    tfoot {{ display: table-footer-group; }}
    tbody {{ display: table-row-group; }}

    .header-cell {{ padding: 30px 45px 5px 45px; }}
    .footer-cell {{ padding: 5px 45px 30px 45px; }}
    .body-cell {{ padding: 10px 45px; vertical-align: top; }}

    /* Clinic Header */
    .tagline {{ text-align: center; color: #8B0000; font-size: 11px; margin-bottom: 12px; font-weight: 500; font-style: italic; }}
    .header-content {{ display: flex; justify-content: space-between; align-items: flex-start; }}
    .dr-info {{ flex: 1; }}
    .dr-name {{ color: #222; font-size: 22px; font-weight: 700; margin-bottom: 2px; }}
    .dr-degree {{ color: #666; font-size: 13px; margin-bottom: 8px; }}
    .dr-title {{ color: #222; font-size: 15px; font-weight: 700; margin-bottom: 2px; }}
    .dr-hospital {{ color: #666; font-size: 13px; margin-bottom: 10px; }}
    .dr-contact-item {{ font-size: 11px; color: #444; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }}
    .logo-container {{ width: 170px; text-align: right; }}
    .logo-img {{ width: 100%; max-height: 90px; object-fit: contain; }}
    .maroon-line {{ border-bottom: 3.5px solid #8B0000; margin-top: 12px; }}

    /* Patient Info Box */
    .patient-box {{
      border: 1.5px solid #d1d5db;
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 25px;
      margin-bottom: 25px;
    }}
    .p-grid {{ display: grid; grid-template-columns: 1fr 1fr 1.2fr 1fr; gap: 12px 20px; }}
    .p-item {{ display: flex; flex-direction: column; }}
    .p-label {{ color: #8B0000; font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }}
    .p-value {{ font-size: 14px; font-weight: 700; color: #000; }}

    /* Layout for Vitals & Rx */
    .main-layout {{ display: flex; min-height: 600px; }}
    .sidebar {{ width: 215px; border-right: 1.5px solid #e5e7eb; padding-right: 20px; flex-shrink: 0; }}
    .content {{ flex: 1; padding-left: 25px; }}

    .v-row {{ display: flex; justify-content: space-between; padding: 4.5px 0; align-items: baseline; }}
    .v-label {{ color: #000; font-weight: 700; font-size: 13px; width: 110px; }}
    .v-value {{ color: #333; font-size: 13px; font-weight: 500; flex: 1; text-align: left; }}

    .rx-sec {{ margin-bottom: 22px; }}
    .rx-sec-title {{ color: #000; font-weight: 700; font-size: 14px; margin-bottom: 5px; }}
    .rx-sec-val {{ color: #333; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }}

    /* Fixed Footer placement */
    .footer-wrapper {{
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 190px;
      padding: 5px 45px 30px 45px;
      background: white;
      z-index: 1000;
    }}

    .tfoot-spacer {{
      height: 190px;
    }}

    /* Footer Details Refinement */
    .footer-divider {{ border-top: 1px solid #e5e7eb; margin-bottom: 12px; }}
    .services-row {{ color: #8B0000; font-weight: 500; font-size: 14px; text-align: center; margin-bottom: 8px; font-family: 'Arial', sans-serif; letter-spacing: 1px; word-spacing: 20px; }}
    .timings-row {{ text-align: center; font-size: 13px; margin-bottom: 8px; color: #333; }}
    .timings-row b {{ color: #8B0000; font-weight: 700; }}

    .medicover-line {{ display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }}
    .outline-heart {{ color: #8B0000; font-size: 18px; margin-right: 2px; }}
    .medicover-text {{ color: #022b4d; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; }}
    .hospital-text {{ color: #888; font-weight: 500; font-size: 13px; text-transform: uppercase; }}
    .location-text {{ color: #888; font-weight: 500; font-size: 13px; }}

    .address-box {{ font-size: 11.5px; color: #777; text-align: center; max-width: 700px; margin: 0 auto 10px; line-height: 1.4; }}
    .appointment-call {{ text-align: center; font-weight: 700; font-size: 13px; color: #000; }}

    /* Print Tweaks */
    @media print {{
      body {{ -webkit-print-color-adjust: exact; }}
      .v-row, .rx-sec, .p-item {{ break-inside: avoid; }}
      .footer-wrapper {{ position: fixed; bottom: 0; }}
    }}
  </style>
</head>
<body>
  <div class="footer-wrapper">
    <div class="footer-divider"></div>
    <div class="services-row">ECG &nbsp; ECHO &nbsp; TMT &nbsp; HOLTER &nbsp; ABPM</div>
    <div class="timings-row">
      <b>Chanda Nagar :</b> Morning : 8.30 am to 10.30 am, <b>Evening</b> 6.30 pm to 9.30 pm
    </div>
    <div class="medicover-line">
       <span class="outline-heart">&#9825;</span>
       <span class="medicover-text">MEDICOVER</span>
       <span class="hospital-text">HOSPITALS</span>
       <span class="location-text">Hitech City</span>
    </div>
    <div class="address-box">
      SVL Towers, Ground Floor, Opp. Anu Furniture, Beside Narayana Junior Collage, Chanda Nagar<br/>
      Hyderabad - 500 050, Telangana Email: balajiheartcenter.hyd@gmail.com
    </div>
    <div class="appointment-call">For Appointment: +91 9100079990 / 9010278278 / 040-2303 2345</div>
  </div>

  <table class="print-container">
    <thead>
      <tr><td class="header-cell">
        <div class="tagline">30 Years Experience in Treating BP and Heart Diseases</div>
        <div class="header-content">
          <div class="dr-info">
            <div class="dr-name">{_esc(doctor_name)}</div>
            <div class="dr-degree">{dr_degree}</div>
            <div class="dr-title">{_esc(doctor_speciality)}</div>
            <div class="dr-hospital">Medicover Hospitals - Hitech City</div>
            <div class="dr-contact-item"><span>&#9990;</span> {_esc(doctor_phone)}</div>
            <div class="dr-contact-item"><span>&#127760;</span> www.balajiheartcenter.com</div>
            <div class="dr-contact-item"><span>&#128100;</span> www.facebook.com/balajiheartcenter</div>
          </div>
          <div class="logo-container">
            <img src="{logo_src}" class="logo-img" alt="Clinic Logo" />
          </div>
        </div>
        <div class="maroon-line"></div>
      </td></tr>
    </thead>
    <tfoot>
      <tr><td class="tfoot-spacer"></td></tr>
    </tfoot>
    <tbody>
      <tr><td class="body-cell">

        <!-- Patient Profile Box -->
        <div class="patient-box">
          <div class="p-grid">
            <div class="p-item">
              <span class="p-label">MR. No:</span>
              <span class="p-value">{_esc(mr_number)}</span>
            </div>
            <div class="p-item">
              <span class="p-label">DATE:</span>
              <span class="p-value">{rx_date}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Patient Name:</span>
              <span class="p-value">{_esc(patient_name)}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Gender/Age:</span>
              <span class="p-value">{_esc(gender)} / {age}</span>
            </div>
            <div class="p-item">
              <span class="p-label">OP No:</span>
              <span class="p-value">{_esc(op_number)}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Weight:</span>
              <span class="p-value">{weight}</span>
            </div>
            <div class="p-item">
              <span class="p-label">Mobile No:</span>
              <span class="p-value">{_esc(phone)}</span>
            </div>
          </div>
        </div>

        <div class="main-layout">
          <!-- Left Sidebar: Vitals (Only first page content will exist here) -->
          <div class="sidebar">
            {vitals_header_html}
            <div class="v-row"><span class="v-label">SPO2:</span> <span class="v-value">{spo2}</span></div>
            <div class="v-row"><span class="v-label">PR:</span> <span class="v-value">{pulse}</span></div>
            <div class="v-row"><span class="v-label">CVS:</span> <span class="v-value">{cvs}</span></div>
            <div class="v-row"><span class="v-label">RS:</span> <span class="v-value">{rs}</span></div>
            <div class="v-row"><span class="v-label">JVP:</span> <span class="v-value">{jvp}</span></div>
            <div class="v-row"><span class="v-label">BP:</span> <span class="v-value">{bp}</span></div>
            <div class="v-row"><span class="v-label">HTN:</span> <span class="v-value">{htn}</span></div>
            <div class="v-row"><span class="v-label">DM:</span> <span class="v-value">{dm}</span></div>
            <div class="v-row"><span class="v-label">SMOKING:</span> <span class="v-value">{smoking}</span></div>
            <div class="v-row"><span class="v-label">THYROID:</span> <span class="v-value">-</span></div>
            <div class="v-row"><span class="v-label">HLP:</span> <span class="v-value">{hlp}</span></div>
            <div class="v-row"><span class="v-label">F H/O CAD:</span> <span class="v-value">{family_ho_cad}</span></div>
            <div class="v-row"><span class="v-label">HEART DISEASE:</span> <span class="v-value">{heart_disease}</span></div>
            <div class="v-row"><span class="v-label">PTCA/CABG:</span> <span class="v-value">{ptca_cabg}</span></div>
            <div class="v-row"><span class="v-label">DRUGS:</span> <span class="v-value">{current_drugs}</span></div>
          </div>

          <!-- Right Content: Flowable Prescription sections -->
          <div class="content">
            <div class="rx-sec">
              <div class="rx-sec-title">Complaint:</div>
              <div class="rx-sec-val">{complaint}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">History:</div>
              <div class="rx-sec-val">{history}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Treatment:</div>
              <div class="rx-sec-val">{treatment_text}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Diagnosis:</div>
              <div class="rx-sec-val">{diagnosis}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Advice:</div>
              <div class="rx-sec-val">{advice}</div>
            </div>
            <div class="rx-sec">
              <div class="rx-sec-title">Lab/Investigation:</div>
              <div class="rx-sec-val">{lab_tests}</div>
            </div>
          </div>
        </div>

      </td></tr>
    </tbody>
  </table>
</body>
</html>'''

    return html


def generate_prescription_pdf(
    prescription: Prescription,
    vitals: Optional[PatientVitals] = None,
    is_old_vitals: bool = False,
    source_op_number: Optional[str] = None,
    visit_date: Optional[str] = None,
) -> str:
    """Generate prescription PDF and store in uploads/prescriptions/ folder.

    Uses Playwright which supports modern CSS (flexbox, grid) to ensure
    100% layout match with the browser print output.

    Returns the stored PDF file path.

    Args:
        prescription: The prescription model
        vitals: The vitals model (current or fallback from previous visit)
        is_old_vitals: True if vitals are from a previous visit
        source_op_number: The OP number from which old vitals were taken
        visit_date: The date of the previous visit (ISO format)
    """
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
        generate_prescription(html, pdf_path)
    except Exception as e:
        logger.error(f"PDF generation error: {e}\n{traceback.format_exc()}")
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise

    logger.info(f"Prescription PDF stored at: {pdf_path}")
    return pdf_path
