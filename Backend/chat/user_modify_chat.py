from datetime import datetime

from fastapi import Depends, HTTPException

from utils import get_api_key, supabase

from .schemas import ChatListItem, CreateChatRequest, RenameRequest


async def list_user_chats(user_id: int, api_key: str = Depends(get_api_key)):

    result = (
        supabase.table("chat")
        .select("id, title, updated_at")
        .eq("user_id", user_id)
        .eq("deleted", False)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


async def rename_chat_title(
    chat_id: int, request: RenameRequest, api_key: str = Depends(get_api_key)
):
    """
    modify chat title by chat_id
    """

    supabase.table("chat").update(
        {"title": request.new_title, "updated_at": datetime.now().isoformat()}
    ).eq("id", chat_id).execute()

    return {"message": "Title updated successfully"}


async def hide_chat_record(chat_id: int, api_key: str = Depends(get_api_key)):

    result = (
        supabase.table("chat")
        .update(
            {
                "deleted": True,
                "deleted_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
        )
        .eq("id", chat_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Chat not found or update failed")
    return {"message": "Chat hidden (soft deleted)"}


async def create_chat_record(
    request: CreateChatRequest, api_key: str = Depends(get_api_key)
):

    # check the number of chats created by the user
    result = (
        supabase.table("chat")
        .select("title")
        .eq("deleted", False)
        .eq("user_id", request.user_id)
        .execute()
    )
    count = len(result.data) if result.data else 0
    title = "newchat" if count == 0 else f"chat{str(count).zfill(2)}"
    now = datetime.now().isoformat()
    insert = (
        supabase.table("chat")
        .insert(
            {
                "user_id": request.user_id,
                "title": title,
                "deleted": False,
                "chat": {"messages": []},
                "created_at": now,
                "updated_at": now,
            }
        )
        .execute()
    )
    # check if the insert was successful
    if not insert.data or len(insert.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create chat")
    new_chat_id = insert.data[0]["id"]
    return ChatListItem(
        id=new_chat_id, title=title, updated_at=datetime.fromisoformat(now)
    )
