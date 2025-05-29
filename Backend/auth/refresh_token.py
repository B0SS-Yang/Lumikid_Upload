from datetime import datetime, timedelta, timezone

from utils import (
    ACCESS_TOKEN_EXPIRE_SECONDS,
    create_jwt_token,
    supabase,
    verify_jwt_token,
)


async def refresh(token: str):
    user_id = verify_jwt_token(token)
    new_token = create_jwt_token(user_id)
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)

    supabase.table("User").update(
        {"token": new_token, "token_expire": expire.isoformat()}
    ).eq("user_id", user_id).execute()

    return {"access_token": new_token, "token_type": "bearer"}
