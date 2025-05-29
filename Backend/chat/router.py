from typing import List

from fastapi import APIRouter

from .chat import handle_chat
from .chat_history import get_chat_history
from .reset_chat import reset_chat_session
from .schemas import ChatHistoryResponse, ChatListItem, ChatResponse
from .user_modify_chat import (
    create_chat_record,
    hide_chat_record,
    list_user_chats,
    rename_chat_title,
)
from .voice_chat import voicechat

chat_router = APIRouter()


chat_router.post("/voice-chat")(voicechat)
chat_router.post("/chat", response_model=ChatResponse)(handle_chat)
chat_router.post("/chat/reset", summary="clear chat ID")(reset_chat_session)
chat_router.get("/chathistory/{conversation_id}", response_model=ChatHistoryResponse)(
    get_chat_history
)
chat_router.get("/chats", response_model=List[ChatListItem])(list_user_chats)
chat_router.post("/chats/{chat_id}/rename")(rename_chat_title)
chat_router.post("/chats/{chat_id}/hide", summary="delete chat record from frontend")(
    hide_chat_record
)
chat_router.post("/chats/create", response_model=ChatListItem)(create_chat_record)
