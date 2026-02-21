"""
TTS Controller - Google Cloud Text-to-Speech API endpoint
"""

import os
import re
import traceback
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter(tags=["TTS"])

# Resolve credentials path
CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not CREDENTIALS_PATH:
    CREDENTIALS_PATH = str(Path(__file__).parent.parent.parent / "google-tts-key.json")

print(f"[TTS] Credentials path: {CREDENTIALS_PATH}")
print(f"[TTS] Credentials file exists: {Path(CREDENTIALS_PATH).exists()}")


class TTSRequest(BaseModel):
    text: str
    language: str


def convert_to_ssml_english(text: str) -> str:
    """
    Convert text to SSML for English, reading numbers as digits.
    Example: OP-20260221-019 -> O P <say-as interpret-as="characters">20260221</say-as> <say-as interpret-as="characters">019</say-as>
    """
    def replace_number(match: re.Match) -> str:
        num = match.group(0)
        return f'<say-as interpret-as="characters">{num}</say-as>'

    # Replace sequences of digits with SSML say-as
    ssml_text = re.sub(r'\d+', replace_number, text)

    return f'<speak>{ssml_text}</speak>'


@router.post("/tts/generate")
def generate_speech(request: TTSRequest):
    """
    Generate speech audio from text using Google Cloud TTS.
    """
    print(f"[TTS] Request received - language: {request.language}, text: {request.text[:50]}...")

    # Step 1: Verify credentials file
    creds_path = Path(CREDENTIALS_PATH)
    if not creds_path.exists():
        error_msg = f"Credentials file not found at: {CREDENTIALS_PATH}"
        print(f"[TTS ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    # Step 2: Load credentials
    try:
        from google.oauth2 import service_account
        credentials = service_account.Credentials.from_service_account_file(str(creds_path))
        print(f"[TTS] Credentials loaded - project: {credentials.project_id}")
    except Exception as e:
        error_msg = f"Failed to load credentials: {e}"
        print(f"[TTS ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

    # Step 3: Create TTS client
    try:
        from google.cloud import texttospeech
        client = texttospeech.TextToSpeechClient(credentials=credentials)
        print("[TTS] Client created successfully")
    except Exception as e:
        error_msg = f"Failed to create TTS client: {e}"
        print(f"[TTS ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

    # Step 4: Configure voice and input
    try:
        language_code = "te-IN" if request.language == "telugu" else "en-IN"

        # Use SSML for English to read numbers as digits
        if request.language == "english":
            ssml_text = convert_to_ssml_english(request.text)
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
            print(f"[TTS] Using SSML: {ssml_text[:100]}...")
        else:
            synthesis_input = texttospeech.SynthesisInput(text=request.text)

        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
        )
        print(f"[TTS] Voice configured - language_code: {language_code}")
    except Exception as e:
        error_msg = f"Failed to configure voice: {e}"
        print(f"[TTS ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

    # Step 5: Synthesize speech
    try:
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )
        print(f"[TTS] Speech synthesized - audio size: {len(response.audio_content)} bytes")
    except Exception as e:
        error_msg = f"Google TTS API error: {e}"
        print(f"[TTS ERROR] {error_msg}")
        traceback.print_exc()

        error_str = str(e).lower()
        if "billing" in error_str:
            error_msg = "Billing not enabled on Google Cloud project"
        elif "permission" in error_str or "403" in error_str:
            error_msg = "Service account lacks Text-to-Speech API permissions"
        elif "not enabled" in error_str or "404" in error_str:
            error_msg = "Cloud Text-to-Speech API not enabled in Google Cloud Console"
        elif "invalid" in error_str and "credentials" in error_str:
            error_msg = "Invalid service account credentials"

        raise HTTPException(status_code=500, detail=error_msg)

    return Response(
        content=response.audio_content,
        media_type="audio/mpeg",
    )
