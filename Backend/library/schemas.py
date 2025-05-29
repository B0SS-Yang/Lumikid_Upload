from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class Book(BaseModel):
    id: str
    pdf_url: Optional[str] = None


class BookDetail(BaseModel):
    id: str
    pdf_url: Optional[str] = None
    title: str
    cover_url: str
    abstract: str
    author: str
    pages: int
    language: str
    age_range: str
    categories: List[str]
    last_updated: str


class SignedURLResponse(BaseModel):
    url: str
    expires_at: datetime


class AudioResponse(BaseModel):
    audio_url: str
    expires_at: datetime
    duration_seconds: float
