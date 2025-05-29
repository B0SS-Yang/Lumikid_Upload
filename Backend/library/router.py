from typing import List

from fastapi import APIRouter

from .audible_book import get_audio_link, read_book_aloud
from .book_process import refresh_local_data
from .pdf import get_book_details, get_pdf_link, list_books
from .schemas import AudioResponse, Book, BookDetail, SignedURLResponse

library_router = APIRouter()

library_router.get("/pdf-link/{book_id}", response_model=SignedURLResponse)(
    get_pdf_link
)
library_router.get("/books/{book_id}", response_model=BookDetail)(get_book_details)
library_router.get("/books", response_model=List[Book])(list_books)

library_router.get("/audio-link/{book_id}", response_model=SignedURLResponse)(
    get_audio_link
)
library_router.post("/books/{book_id}/read-aloud", response_model=AudioResponse)(
    read_book_aloud
)
library_router.post("/books/refresh-local")(refresh_local_data)
