import os
import time
from datetime import datetime
from io import BytesIO
from urllib.parse import unquote

from utils import SUPABASE_URL, supabase

from .configs import BUCKET_NAME, LINK_EXPIRATION, MAX_RETRIES, RETRY_DELAY


def extract_filename_from_url(url: str) -> str:
    """Extract the filename from a storage URL"""
    if not url:
        return None

    try:
        if "/object/public/" in url:
            parts = url.split(f"/object/public/{BUCKET_NAME}/")
        elif "/object/authenticated/" in url:
            parts = url.split(f"/object/authenticated/{BUCKET_NAME}/")
        else:
            parts = url.split(f"/{BUCKET_NAME}/")

        if len(parts) > 1:
            return parts[1]
        return None
    except Exception:
        return None


def get_storage_url(bucket_name, filename):
    """Construct the public URL for a stored file"""
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{filename}"


async def generate_signed_url(file_path: str) -> str:
    """Generate a signed URL for a file in storage"""
    try:
        file_path = unquote(file_path)
        response = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            file_path, LINK_EXPIRATION
        )

        if not response or "signedUrl" not in response:
            raise Exception("Failed to generate signed URL - no URL in response")

        return response["signedUrl"]
    except Exception as e:
        raise Exception(f"Error generating signed URL: {str(e)}")


def upload_to_storage(file_path, bucket_name):
    """Upload file to Supabase storage with proper error handling"""
    try:
        filename = os.path.basename(file_path)

        for attempt in range(MAX_RETRIES):
            try:
                with open(file_path, "rb") as f:
                    response = supabase.storage.from_(bucket_name).upload(
                        file=f,
                        path=filename,
                        file_options={
                            "content-type": "application/pdf",
                            "x-upsert": "true",
                        },
                    )

                    if isinstance(response, dict) and response.get("error"):
                        raise Exception(response["error"])

                    return get_storage_url(bucket_name, filename)

            except Exception as e:
                if "409" in str(e):  # File already exists
                    return get_storage_url(bucket_name, filename)

                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                raise e

    except Exception as e:
        print(f"Error uploading {filename} to {bucket_name}: {str(e)}")
        return None


def upload_book_to_supabase(pdf_url):
    """Upload book data to Supabase (only PDF URL)"""
    for attempt in range(MAX_RETRIES):
        try:
            # We let Supabase generate the UUID automatically
            response = supabase.table("books").insert({"pdf_url": pdf_url}).execute()

            if hasattr(response, "error"):
                raise Exception(response.error)

            print(f"Successfully uploaded book with PDF URL: {pdf_url}")
            return True

        except Exception as e:
            print(f"Error uploading book (attempt {attempt + 1}): {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            print(f"Failed to upload book after {MAX_RETRIES} attempts")
            return False


async def upload_audio_to_storage(audio_data: BytesIO, book_id: str) -> str:
    """Upload generated audio to storage and return URL using service role"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"audio/{book_id}_{timestamp}.mp3"

        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=audio_data.getvalue(),
            file_options={"content-type": "audio/mpeg", "x-upsert": "true"},
        )

        if isinstance(res, dict) and res.get("error"):
            raise Exception(res.get("message", str(res)))

        # Generate signed URL
        signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            filename, LINK_EXPIRATION
        )

        if not signed_url or "signedUrl" not in signed_url:
            raise Exception("Failed to generate signed URL")

        return signed_url["signedUrl"]
    except Exception as e:
        raise Exception(f"Error uploading audio: {str(e)}")
