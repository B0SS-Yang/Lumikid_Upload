from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    id: Optional[int] = None
    chatID: Optional[int] = None
    user_id: int
    message: str
    age: Optional[int] = Field(default=None, ge=3, le=7)
    interests: Optional[List[str]] = None
    language: Optional[str] = "en"
    context: Optional[List[Dict[str, str]]] = None


class MessageItem(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ChatResponse(BaseModel):
    id: int
    response: str
    chat: Dict[str, List[MessageItem]]
    timestamp: datetime
    is_safe: bool = True


class ChatHistoryResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str]
    chat: Dict[str, List[MessageItem]]
    created_at: datetime
    updated_at: datetime


class ChatListItem(BaseModel):
    id: int
    title: Optional[str]
    updated_at: datetime


class RenameRequest(BaseModel):
    new_title: str


class CreateChatRequest(BaseModel):
    user_id: int
