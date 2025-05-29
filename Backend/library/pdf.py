from datetime import datetime, timedelta

from fastapi import Depends, HTTPException

from utils import get_api_key, supabase

from .configs import BOOKS_METADATA, LINK_EXPIRATION
from .schemas import Book, BookDetail, SignedURLResponse
from .storage_utils import extract_filename_from_url, generate_signed_url


async def get_pdf_link(book_id: str, api_key: str = Depends(get_api_key)):
    """Generate and return a signed URL for accessing a book PDF"""
    try:
        result = supabase.table("books").select("pdf_url").eq("id", book_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Book not found")

        book = result.data[0]
        pdf_url = book.get("pdf_url")

        if not pdf_url:
            raise HTTPException(
                status_code=400, detail="No PDF URL found for this book"
            )

        filename = extract_filename_from_url(pdf_url)
        if not filename:
            raise HTTPException(
                status_code=400, detail="Could not extract filename from PDF URL"
            )

        signed_url = await generate_signed_url(filename)
        expires_at = datetime.now() + timedelta(seconds=LINK_EXPIRATION)

        return SignedURLResponse(url=signed_url, expires_at=expires_at)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating PDF link: {str(e)}"
        )


async def get_book_details(book_id: str, api_key: str = Depends(get_api_key)):
    """Get complete book details including PDF URL"""
    try:
        # Get book from Supabase
        supabase_result = (
            supabase.table("books").select("*").eq("id", book_id).execute()
        )

        if not supabase_result.data:
            raise HTTPException(status_code=404, detail="Book not found in database")

        book_data = supabase_result.data[0]

        all_books = supabase.table("books").select("id").execute().data
        try:
            book_index = next(
                i for i, book in enumerate(all_books) if book["id"] == book_id
            )
        except StopIteration:
            book_index = 0

        try:
            metadata = BOOKS_METADATA[book_index]
        except IndexError:
            metadata = {}

        # Generate signed URL
        pdf_url = None
        if book_data.get("pdf_url"):
            try:
                pdf_url = await generate_signed_url(
                    extract_filename_from_url(book_data["pdf_url"])
                )
            except Exception as e:
                print(f"Warning: Could not generate signed URL: {str(e)}")

        return BookDetail(
            id=book_id,
            pdf_url=pdf_url,
            title=metadata.get("title", "Unknown Title"),
            cover_url=metadata.get("cover_url", ""),
            abstract=metadata.get("abstract", "No description available"),
            author=metadata.get("author", "Unknown Author"),
            pages=metadata.get("pages", 0),
            language=metadata.get("language", "Unknown"),
            age_range=metadata.get("age_range", "Not specified"),
            categories=metadata.get("categories", []),
            last_updated=metadata.get("last_updated", ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching book details: {str(e)}"
        )


async def list_books(api_key: str = Depends(get_api_key)):
    """Get list of all books with their PDF URLs"""
    try:
        result = supabase.table("books").select("id, pdf_url").execute()

        if not result.data:
            return []

        return [
            Book(id=book["id"], pdf_url=book.get("pdf_url")) for book in result.data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching books: {str(e)}")
