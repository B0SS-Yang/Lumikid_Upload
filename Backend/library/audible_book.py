from datetime import datetime, timedelta
from typing import List

import requests
from fastapi import Depends, HTTPException

from utils import get_api_key, supabase

from .configs import LINK_EXPIRATION
from .schemas import AudioResponse
from .storage_utils import (
    extract_filename_from_url,
    generate_signed_url,
    upload_audio_to_storage,
)
from .tts_utils import extract_text_from_pdf, generate_audio_from_text


async def get_audio_link(book_id: str, api_key: str = Depends(get_api_key)):
    try:
        # Query the database

        supabase_result = (
            supabase.table("Books").select("id, audio_path").eq("Id", book_id).execute()
        )

        if not supabase_result.data:
            raise HTTPException(status_code=404, detail="Book not found")

        book = supabase_result.data[0]
        audio_path = book.get("Audio path")
        if not audio_path:
            raise HTTPException(status_code=404, detail="Audio path not found")

        # Generate a signature link

        signed = supabase.storage.from_("Books").create_signed_url(audio_path, 3600)
        signed_url = signed.get("Signed url")

        if not signed_url:
            raise HTTPException(
                status_code=500, detail="Supabase returned no signed URL"
            )

        return {
            "Url": signed_url,
            "Expires at": datetime.utcnow() + timedelta(seconds=3600),
        }

    except Exception as e:
        print("An error occurred with audio link:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


async def read_book_aloud(
    book_id: str, voice: str = "Alloy", api_key: str = Depends(get_api_key)
):
    """Convert book content to speech using OpenAI TTS"""
    try:
        # the PDF URL

        book_result = (
            supabase.table("Books").select("Pdf url").eq("Id", book_id).execute()
        )
        if not book_result.data:
            raise HTTPException(status_code=404, detail="Book not found")

        pdf_url = book_result.data[0].get("Pdf url")
        if not pdf_url:
            raise HTTPException(
                status_code=400, detail="No PDF available for this book"
            )

        # signed URL for the PDF

        signed_pdf_url = await generate_signed_url(extract_filename_from_url(pdf_url))

        # Extract text from PDF

        text = extract_text_from_pdf(signed_pdf_url)
        if not text:
            raise HTTPException(status_code=400, detail="No readable text found in PDF")

        # Generate audio (limit text length for TTS)

        text = text[:4000]
        audio_data = await generate_audio_from_text(text, voice)

        # Upload audio

        audio_url = await upload_audio_to_storage(audio_data, book_id)

        return AudioResponse(
            audio_url=audio_url,
            expires_at=datetime.now() + timedelta(seconds=LINK_EXPIRATION),
            duration_seconds=len(audio_data.getvalue()) / 16000,
        )
    except HTTPException as he:
        raise he
    except requests.exceptions.RequestException as re:
        raise HTTPException(
            status_code=502, detail=f"External service error: {str(re)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating audio book: {str(e)}"
        )
