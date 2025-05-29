from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status

from utils import get_api_key, supabase

from .schemas import ChatHistoryResponse, MessageItem


async def get_chat_history(conversation_id: int, api_key: str = Depends(get_api_key)):
    # get chat history by conversation_id
    result = (
        supabase.table("chat").select("*").eq("id", conversation_id).single().execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat history not found"
        )
    chat_record = result.data
    # convert message data to MessageItem
    messages = [
        MessageItem(
            role=msg["role"],
            content=msg["content"],
            timestamp=datetime.fromisoformat(msg["timestamp"]),
        )
        for msg in chat_record["chat"]["messages"]
        if isinstance(msg, dict)
        and "role" in msg
        and "content" in msg
        and "timestamp" in msg
    ]
    return ChatHistoryResponse(
        id=chat_record["id"],
        user_id=chat_record["user_id"],
        title=chat_record["title"],
        chat={"messages": messages},
        created_at=datetime.fromisoformat(chat_record["created_at"]),
        updated_at=datetime.fromisoformat(chat_record["updated_at"]),
    )


def get_or_create_chat_record(
    user_id: str, conversation_id: Optional[str], game: bool = False
):
    chat_record = None
    if conversation_id:
        result = (
            supabase.table("chat")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        chat_record = result.data if result.data else None

    if chat_record and chat_record["user_id"] != user_id:
        chat_record = None  # clear chat_record if user_id does not match

    if not chat_record:
        existing_chats = (
            supabase.table("chat").select("title").eq("user_id", user_id).execute()
        )
        count = len(existing_chats.data)
        title = "newchat" if count == 0 else f"chat{str(count).zfill(2)}"
        insert = (
            supabase.table("chat")
            .insert(
                {
                    "user_id": user_id,
                    "title": title,
                    "deleted": False,
                    "chat": {"messages": []},
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "game": game,
                }
            )
            .execute()
        )
        chat_record = insert.data[0]

    return chat_record


def update_chat_record(chat_id: str, chat_data: dict):
    supabase.table("chat").update(
        {"chat": chat_data, "updated_at": datetime.now().isoformat()}
    ).eq("id", chat_id).execute()
