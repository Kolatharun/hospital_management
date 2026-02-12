"""
Notification Service - Send bill receipts and prescriptions via Email and WhatsApp.

Supports:
- Email: SMTP-based email with PDF attachment
- WhatsApp: WhatsApp Business Cloud API with PDF document

Prescription emails/WhatsApp have separate bodies for:
- Patient: Personal message with appointment details
- Lab: Professional message with lab tests requested
- Pharmacy: Professional message with medicines prescribed
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email_with_receipt(
    to_email: str,
    patient_name: str,
    bill_number: str,
    pdf_path: str,
) -> bool:
    """Send bill receipt PDF via email using SMTP.

    Returns True on success, raises on failure.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        raise ValueError(
            "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, "
            "SMTP_PASSWORD in environment variables."
        )

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = f"Balaji Heart Center - Bill Receipt {bill_number}"

    body = (
        f"Dear {patient_name},\n\n"
        f"Please find attached your bill receipt ({bill_number}) "
        f"from Balaji Heart Center.\n\n"
        f"Thank you for visiting Balaji Heart Center!\n"
        f"For Appointments: +91 9100079990 / 9010278278 / 040-2303 2345\n"
        f"www.balajiheartcenter.com"
    )
    msg.attach(MIMEText(body, "plain"))

    # Attach PDF
    filename = f"Receipt_{bill_number}.pdf"
    with open(pdf_path, "rb") as f:
        pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
        pdf_attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(pdf_attachment)

    try:
        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email} for bill {bill_number}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        raise


def send_whatsapp_with_receipt(
    phone_number: str,
    patient_name: str,
    bill_number: str,
    pdf_path: str,
) -> bool:
    """Send bill receipt PDF via WhatsApp Business Cloud API.

    Returns True on success, raises on failure.
    """
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise ValueError(
            "WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and "
            "WHATSAPP_ACCESS_TOKEN in environment variables."
        )

    # Clean phone number - ensure it starts with country code
    clean_phone = phone_number.replace(" ", "").replace("-", "").replace("+", "")
    if clean_phone.startswith("0"):
        clean_phone = "91" + clean_phone[1:]
    elif not clean_phone.startswith("91"):
        clean_phone = "91" + clean_phone

    api_url = f"https://graph.facebook.com/v21.0/{settings.WHATSAPP_PHONE_NUMBER_ID}"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
    }

    # Step 1: Upload the PDF as media
    filename = f"Receipt_{bill_number}.pdf"
    with open(pdf_path, "rb") as f:
        upload_response = httpx.post(
            f"{api_url}/media",
            headers=headers,
            files={"file": (filename, f, "application/pdf")},
            data={"messaging_product": "whatsapp"},
            timeout=30,
        )

    if upload_response.status_code != 200:
        logger.error(f"WhatsApp media upload failed: {upload_response.text}")
        raise RuntimeError(f"WhatsApp media upload failed: {upload_response.text}")

    media_id = upload_response.json().get("id")
    if not media_id:
        raise RuntimeError("WhatsApp media upload returned no media ID")

    # Step 2: Send the document message
    message_payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename,
            "caption": (
                f"Bill Receipt - {bill_number}\n"
                f"Patient: {patient_name}\n"
                f"From Balaji Heart Center\n"
                f"Thank you for your visit!"
            ),
        },
    }

    send_response = httpx.post(
        f"{api_url}/messages",
        headers={**headers, "Content-Type": "application/json"},
        json=message_payload,
        timeout=30,
    )

    if send_response.status_code not in (200, 201):
        logger.error(f"WhatsApp message send failed: {send_response.text}")
        raise RuntimeError(f"WhatsApp message send failed: {send_response.text}")

    logger.info(f"WhatsApp receipt sent to {clean_phone} for bill {bill_number}")
    return True


def send_email_with_day_summary(
    to_email: str,
    summary_date: str,
    pdf_path: str,
) -> bool:
    """Send day payment summary PDF via email using SMTP.

    Returns True on success, raises on failure.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        raise ValueError(
            "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, "
            "SMTP_PASSWORD in environment variables."
        )

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = f"Balaji Heart Center - Day Payments Summary - {summary_date}"

    body = (
        f"Dear Team,\n\n"
        f"Please find attached the Day Payments Summary for {summary_date} "
        f"from Balaji Heart Center.\n\n"
        f"Thank you!\n"
        f"Balaji Heart Center\n"
        f"Ph: +91 9100079990 | www.balajiheartcenter.com"
    )
    msg.attach(MIMEText(body, "plain"))

    filename = f"Day_Summary_{summary_date}.pdf"
    with open(pdf_path, "rb") as f:
        pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
        pdf_attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(pdf_attachment)

    try:
        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Day summary email sent to {to_email} for {summary_date}")
        return True
    except Exception as e:
        logger.error(f"Failed to send day summary email to {to_email}: {e}")
        raise


def send_whatsapp_with_day_summary(
    phone_number: str,
    summary_date: str,
    pdf_path: str,
) -> bool:
    """Send day payment summary PDF via WhatsApp Business Cloud API.

    Returns True on success, raises on failure.
    """
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise ValueError(
            "WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and "
            "WHATSAPP_ACCESS_TOKEN in environment variables."
        )

    clean_phone = phone_number.replace(" ", "").replace("-", "").replace("+", "")
    if clean_phone.startswith("0"):
        clean_phone = "91" + clean_phone[1:]
    elif not clean_phone.startswith("91"):
        clean_phone = "91" + clean_phone

    api_url = f"https://graph.facebook.com/v21.0/{settings.WHATSAPP_PHONE_NUMBER_ID}"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
    }

    filename = f"Day_Summary_{summary_date}.pdf"
    with open(pdf_path, "rb") as f:
        upload_response = httpx.post(
            f"{api_url}/media",
            headers=headers,
            files={"file": (filename, f, "application/pdf")},
            data={"messaging_product": "whatsapp"},
            timeout=30,
        )

    if upload_response.status_code != 200:
        logger.error(f"WhatsApp media upload failed: {upload_response.text}")
        raise RuntimeError(f"WhatsApp media upload failed: {upload_response.text}")

    media_id = upload_response.json().get("id")
    if not media_id:
        raise RuntimeError("WhatsApp media upload returned no media ID")

    message_payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename,
            "caption": (
                f"Day Payments Summary - {summary_date}\n"
                f"From Balaji Heart Center"
            ),
        },
    }

    send_response = httpx.post(
        f"{api_url}/messages",
        headers={**headers, "Content-Type": "application/json"},
        json=message_payload,
        timeout=30,
    )

    if send_response.status_code not in (200, 201):
        logger.error(f"WhatsApp message send failed: {send_response.text}")
        raise RuntimeError(f"WhatsApp message send failed: {send_response.text}")

    logger.info(f"WhatsApp day summary sent to {clean_phone} for {summary_date}")
    return True


# ---------------------------------------------------------------------------
# Shared helpers for prescription email / WhatsApp
# ---------------------------------------------------------------------------

def _send_prescription_email(
    to_email: str,
    subject: str,
    body: str,
    op_number: str,
    pdf_path: str,
) -> bool:
    """Internal helper: send a prescription PDF email with the given subject/body."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        raise ValueError(
            "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, "
            "SMTP_PASSWORD in environment variables."
        )

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    filename = f"Prescription_{op_number}.pdf"
    with open(pdf_path, "rb") as f:
        pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
        pdf_attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(pdf_attachment)

    try:
        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Prescription email sent to {to_email} for {op_number}")
        return True
    except Exception as e:
        logger.error(f"Failed to send prescription email to {to_email}: {e}")
        raise


def _clean_phone(phone_number: str) -> str:
    """Normalise an Indian phone number to 91XXXXXXXXXX format."""
    clean = phone_number.replace(" ", "").replace("-", "").replace("+", "")
    if clean.startswith("0"):
        clean = "91" + clean[1:]
    elif not clean.startswith("91"):
        clean = "91" + clean
    return clean


def _send_prescription_whatsapp(
    phone_number: str,
    caption: str,
    op_number: str,
    pdf_path: str,
) -> bool:
    """Internal helper: send a prescription PDF via WhatsApp with the given caption."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise ValueError(
            "WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and "
            "WHATSAPP_ACCESS_TOKEN in environment variables."
        )

    clean_phone = _clean_phone(phone_number)

    api_url = f"https://graph.facebook.com/v21.0/{settings.WHATSAPP_PHONE_NUMBER_ID}"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
    }

    filename = f"Prescription_{op_number}.pdf"
    with open(pdf_path, "rb") as f:
        upload_response = httpx.post(
            f"{api_url}/media",
            headers=headers,
            files={"file": (filename, f, "application/pdf")},
            data={"messaging_product": "whatsapp"},
            timeout=30,
        )

    if upload_response.status_code != 200:
        logger.error(f"WhatsApp media upload failed: {upload_response.text}")
        raise RuntimeError(f"WhatsApp media upload failed: {upload_response.text}")

    media_id = upload_response.json().get("id")
    if not media_id:
        raise RuntimeError("WhatsApp media upload returned no media ID")

    message_payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename,
            "caption": caption,
        },
    }

    send_response = httpx.post(
        f"{api_url}/messages",
        headers={**headers, "Content-Type": "application/json"},
        json=message_payload,
        timeout=30,
    )

    if send_response.status_code not in (200, 201):
        logger.error(f"WhatsApp message send failed: {send_response.text}")
        raise RuntimeError(f"WhatsApp message send failed: {send_response.text}")

    logger.info(f"WhatsApp prescription sent to {clean_phone} for {op_number}")
    return True


# ---------------------------------------------------------------------------
# Patient prescription email / WhatsApp
# ---------------------------------------------------------------------------

def send_email_with_prescription(
    to_email: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
) -> bool:
    """Send prescription PDF to the patient via email."""
    subject = f"Balaji Heart Center - Your Prescription ({op_number})"
    body = (
        f"Dear {patient_name},\n\n"
        f"Please find attached your prescription (OP: {op_number}) "
        f"from Balaji Heart Center.\n\n"
        f"Please follow the prescribed treatment as advised by the doctor. "
        f"If you have any questions, feel free to contact us.\n\n"
        f"Thank you for visiting Balaji Heart Center!\n"
        f"For Appointments: +91 9100079990 / 9010278278 / 040-2303 2345\n"
        f"www.balajiheartcenter.com"
    )
    return _send_prescription_email(to_email, subject, body, op_number, pdf_path)


def send_whatsapp_with_prescription(
    phone_number: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
) -> bool:
    """Send prescription PDF to the patient via WhatsApp."""
    caption = (
        f"Prescription - {op_number}\n"
        f"Patient: {patient_name}\n"
        f"From Balaji Heart Center\n"
        f"Please follow the prescribed treatment. "
        f"Contact us for any queries.\n"
        f"Thank you for your visit!"
    )
    return _send_prescription_whatsapp(phone_number, caption, op_number, pdf_path)


# ---------------------------------------------------------------------------
# Lab prescription email / WhatsApp
# ---------------------------------------------------------------------------

def send_prescription_to_lab_email(
    to_email: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
    lab_tests: Optional[List[str]] = None,
) -> bool:
    """Send prescription PDF to the lab via email with lab-specific body."""
    tests_str = ", ".join(lab_tests) if lab_tests else "See attached prescription"
    subject = f"Lab Request - {patient_name} ({op_number})"
    body = (
        f"Dear Lab Team,\n\n"
        f"Please find attached the prescription for the following patient:\n\n"
        f"  Patient Name : {patient_name}\n"
        f"  OP Number    : {op_number}\n"
        f"  Tests Requested: {tests_str}\n\n"
        f"Kindly process the above tests and update the results at the earliest.\n\n"
        f"Regards,\n"
        f"Balaji Heart Center\n"
        f"Ph: +91 9100079990 | www.balajiheartcenter.com"
    )
    return _send_prescription_email(to_email, subject, body, op_number, pdf_path)


def send_prescription_to_lab_whatsapp(
    phone_number: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
    lab_tests: Optional[List[str]] = None,
) -> bool:
    """Send prescription PDF to the lab via WhatsApp with lab-specific caption."""
    tests_str = ", ".join(lab_tests) if lab_tests else "See prescription"
    caption = (
        f"Lab Request - {op_number}\n"
        f"Patient: {patient_name}\n"
        f"Tests: {tests_str}\n"
        f"From Balaji Heart Center\n"
        f"Please process and update results."
    )
    return _send_prescription_whatsapp(phone_number, caption, op_number, pdf_path)


# ---------------------------------------------------------------------------
# Pharmacy prescription email / WhatsApp
# ---------------------------------------------------------------------------

def send_prescription_to_pharmacy_email(
    to_email: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
    medicines: Optional[List[str]] = None,
) -> bool:
    """Send prescription PDF to the pharmacy via email with pharmacy-specific body."""
    meds_str = ", ".join(medicines) if medicines else "See attached prescription"
    subject = f"Pharmacy Order - {patient_name} ({op_number})"
    body = (
        f"Dear Pharmacy Team,\n\n"
        f"Please find attached the prescription for the following patient:\n\n"
        f"  Patient Name : {patient_name}\n"
        f"  OP Number    : {op_number}\n"
        f"  Medicines    : {meds_str}\n\n"
        f"Kindly dispense the above medicines as prescribed.\n\n"
        f"Regards,\n"
        f"Balaji Heart Center\n"
        f"Ph: +91 9100079990 | www.balajiheartcenter.com"
    )
    return _send_prescription_email(to_email, subject, body, op_number, pdf_path)


def send_prescription_to_pharmacy_whatsapp(
    phone_number: str,
    patient_name: str,
    op_number: str,
    pdf_path: str,
    medicines: Optional[List[str]] = None,
) -> bool:
    """Send prescription PDF to the pharmacy via WhatsApp with pharmacy-specific caption."""
    meds_str = ", ".join(medicines) if medicines else "See prescription"
    caption = (
        f"Pharmacy Order - {op_number}\n"
        f"Patient: {patient_name}\n"
        f"Medicines: {meds_str}\n"
        f"From Balaji Heart Center\n"
        f"Please dispense as prescribed."
    )
    return _send_prescription_whatsapp(phone_number, caption, op_number, pdf_path)


def cleanup_temp_file(file_path: str) -> None:
    """Delete a temporary file if it exists."""
    try:
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)
            logger.debug(f"Cleaned up temp file: {file_path}")
    except OSError as e:
        logger.warning(f"Failed to clean up temp file {file_path}: {e}")
