from datetime import datetime

from utils import supabase


def save_to_supabase(user_id: int, game_data: dict):
    # Check if there is a corresponding game record

    record = (
        supabase.table("chat")
        .select("id, chat")
        .eq("user_id", user_id)
        .eq("game", True)
        .execute()
        .data
    )

    if len(record) == 1:
        # If there is a record, update chat.messages

        chat_id = record[0]["id"]
        existing_chat = record[0].get("chat", {"messages": []})

        # Make sure messages are list

        messages = existing_chat.get("messages", [])
        messages.append(
            {
                "role": "system",
                "content": game_data.get("content", ""),
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Update records in Supabase

        supabase.table("chat").update(
            {"chat": {"messages": messages}, "updated_at": datetime.now().isoformat()}
        ).eq("id", chat_id).execute()

    else:
        # If there is no record, create a new record, and the initial messages include game_data

        supabase.table("chat").insert(
            {
                "user_id": user_id,
                "title": game_data.get("title", "Game Session"),
                "deleted": False,
                "chat": {
                    "messages": [
                        {
                            "role": "system",
                            "content": game_data.get("content", ""),
                            "timestamp": datetime.now().isoformat(),
                        }
                    ]
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "game": True,
            }
        ).execute()

    return {"message": "success"}
