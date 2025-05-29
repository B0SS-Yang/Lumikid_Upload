from datetime import datetime

from utils import supabase, verify_jwt_token

from .schemas import ActivationStatus


async def delete_account(token: str):
    user_id = verify_jwt_token(token)
    supabase.table("User").update(
        {
            "activated": ActivationStatus.DELETED,
            "token_expire": datetime(1900, 1, 1).isoformat(),
        }
    ).eq("user_id", user_id).execute()
    return {"message": "account deleted"}
