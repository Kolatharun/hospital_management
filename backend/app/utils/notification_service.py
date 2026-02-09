"""
Notification Service - Send bill receipts via Email and WhatsApp.

Supports:
- Email: SMTP-based email with PDF attachment
- WhatsApp: WhatsApp Business Cloud API with PDF document
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional

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


def cleanup_temp_file(file_path: str) -> None:
    """Delete a temporary file if it exists."""
    try:
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)
            logger.debug(f"Cleaned up temp file: {file_path}")
    except OSError as e:
        logger.warning(f"Failed to clean up temp file {file_path}: {e}")
