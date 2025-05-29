import os
import traceback
from datetime import datetime

from fastapi import Depends, HTTPException, Request, Response, status

from utils import get_api_key

from .aichat import generate_chat_response
from .chat_history import get_or_create_chat_record, update_chat_record
from .schemas import ChatRequest, ChatResponse, MessageItem

MAX_CONVERSATION_HISTORY = os.getenv("MAX_CONVERSATION_HISTORY", 100)


async def handle_chat(
    request: ChatRequest,
    response: Response,
    http_request: Request,
    api_key: str = Depends(get_api_key),
):
    try:
        conversation_id = request.id or request.chatID
        chat_record = get_or_create_chat_record(request.user_id, conversation_id)
        conversation_json = chat_record.get("chat", {"messages": []})

        # if no conversation history, add system message
        if not conversation_json["messages"]:
            conversation_json["messages"].append(
                {
                    "role": "system",
                    "content": (
                        f"You are a friendly AI learning companion for children aged {request.age}. "
                        f"Respond in {request.language}. Keep answers simple and educational. "
                        f"Current interests: {', '.join(request.interests) if request.interests else 'general'}"
                    ),
                    "timestamp": datetime.now().isoformat(),
                }
            )

        # add user message
        conversation_json["messages"].append(
            {
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # AI response
        ai_response = generate_chat_response(conversation_json["messages"])

        # add AI response
        conversation_json["messages"].append(
            {
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # update database
        update_chat_record(chat_id=chat_record["id"], chat_data=conversation_json)

        # construct response
        message_items = [
            MessageItem(
                role=msg["role"],
                content=msg["content"],
                timestamp=datetime.fromisoformat(msg["timestamp"]),
            )
            for msg in conversation_json["messages"]
            if "role" in msg and "content" in msg
        ]

        return ChatResponse(
            id=chat_record["id"],
            response=ai_response,
            chat={"messages": message_items},
            timestamp=datetime.now(),
            is_safe=True,
        )

    except HTTPException as e:
        raise e
    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat",
        )
