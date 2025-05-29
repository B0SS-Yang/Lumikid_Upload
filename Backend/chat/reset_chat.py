from fastapi import Depends, Response

from utils import get_api_key


async def reset_chat_session(response: Response, api_key: str = Depends(get_api_key)):
    response.delete_cookie("conversation_id")
    return {"message": "Conversation cookie cleared"}
