import json
import os
import shutil
import tempfile
import traceback
import zipfile
from typing import Any, Dict
from urllib.parse import unquote

from fastapi import Depends, File, UploadFile

from utils import get_api_key, supabase

from .configs import BOOKS_BUCKET, SOURCE_TO_METADATA
from .storage_utils import (
    extract_filename_from_url,
    upload_book_to_supabase,
    upload_to_storage,
)


async def refresh_local_data(
    file: UploadFile = File(...), api_key: str = Depends(get_api_key)
):
    """Endpoint to refresh local data"""
    return {"message": "This endpoint would refresh local data"}


def get_book_metadata(pdf_url: str) -> Dict[str, Any]:
    """Get book metadata by matching the PDF filename with source in books.json"""
    if not pdf_url:
        return {}

    filename = extract_filename_from_url(pdf_url)
    if not filename:
        return {}
    base_filename = os.path.basename(unquote(filename))
    return SOURCE_TO_METADATA.get(base_filename, {})


def process_book_file(file_path):
    """Process a single book file"""
    try:
        filename = os.path.basename(file_path)

        if not file_path.lower().endswith(".pdf"):
            print(f"Skipping non-PDF file: {filename}")
            return None

        print(f"Uploading PDF: {filename}")
        pdf_url = upload_to_storage(file_path, BOOKS_BUCKET)
        if not pdf_url:
            print(f"Failed to upload PDF {filename}")
            return None

        return pdf_url
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        traceback.print_exc()
        return None


def process_books_zip(zip_path):
    """Process all books in a zip file"""
    temp_dir = tempfile.mkdtemp()
    try:
        print("\nDisable RLS first")

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)

        processed_files = 0
        failed_files = 0

        for root, _, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                print(f"\nProcessing {file}...")

                if file.lower().endswith(".pdf"):
                    pdf_url = process_book_file(file_path)
                    if not pdf_url:
                        print(f"Failed to process {file}")
                        failed_files += 1
                        continue

                    if upload_book_to_supabase(pdf_url):
                        processed_files += 1
                        print(f"Successfully processed {file}")
                    else:
                        failed_files += 1
                        print(f"Failed to upload book data from {file}")
                else:
                    print(f"Skipping non-PDF file: {file}")

        print(
            f"\nProcessing completed. Successfully processed {processed_files} files, {failed_files} files failed."
        )
    finally:
        shutil.rmtree(temp_dir)


if __name__ == "__main__":
    try:
        # Test database connection
        result = supabase.table("books").select("count", count="exact").execute()
        print(f"Database connection OK. Current books: {result.count}")

        # Process the zip file
        process_books_zip("books.zip")

    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        exit(1)
