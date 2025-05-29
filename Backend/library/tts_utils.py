import re
from io import BytesIO

import PyPDF2
import requests

from utils import openai_client


def extract_text_from_pdf(pdf_url: str) -> str:
    """Extract text content from a PDF file"""
    try:
        # Download the PDF file
        response = requests.get(pdf_url)
        response.raise_for_status()

        # Read PDF content
        with BytesIO(response.content) as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()

            # Clean up text for TTS
            text = re.sub(r"\s+", " ", text).strip()
            return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


async def generate_audio_from_text(text: str, voice: str = "alloy") -> BytesIO:
    """Generate audio from text using OpenAI TTS"""
    try:
        if len(text) > 4096:  # OpenAI TTS character limit
            text = text[:4096] + "..."  # Truncate with ellipsis

        # Client using OpenAI official SDK
        response = await openai_client.audio.speech.create(
            model="tts-1", input=text, voice=voice, response_format="mp3"
        )

        # Read as BytesIO for subsequent uploads
        audio_data = BytesIO(await response.aread())
        audio_data.seek(0)
        return audio_data

    except Exception as e:
        raise Exception(f"Error generating audio: {str(e)}")
