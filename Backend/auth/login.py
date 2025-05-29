from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from utils import (
    ACCESS_TOKEN_EXPIRE_SECONDS,
    create_jwt_token,
    ensure_valid_subscription,
    supabase,
)

from .schemas import ActivationStatus, UserCredentials


async def login(user_data: UserCredentials):
    user = supabase.table("User").select("*").eq("email", user_data.email).execute()

    if not user.data:
        raise HTTPException(400, detail="email not registered")

    user = user.data[0]

    if user["activated"] == ActivationStatus.DELETED:
        raise HTTPException(401, detail="account deleted")
    if user["activated"] == ActivationStatus.UNVERIFIED:
        raise HTTPException(401, detail="account not verified")

    if user["password"] != user_data.password:
        raise HTTPException(400, detail="password incorrect")

    token = create_jwt_token(user["user_id"])
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)

    supabase.table("User").update(
        {"token": token, "token_expire": expire.isoformat()}
    ).eq("user_id", user["user_id"]).execute()
    ensure_valid_subscription(user["user_id"])
    return {"access_token": token, "token_type": "bearer", "user_id": user["user_id"]}
