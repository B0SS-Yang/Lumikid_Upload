from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from utils import ACCESS_TOKEN_EXPIRE_SECONDS, ensure_valid_subscription, supabase

from .schemas import ActivationStatus, User, UserCredentials
from .verify_email import send_verification_email

#  registration


async def register(user_data: UserCredentials):
    email, password = user_data.email, user_data.password

    # inspect if user exists
    existing = supabase.table("User").select("*").eq("email", email).execute()

    if existing.data:
        user = existing.data[0]
        if user["activated"] == ActivationStatus.VERIFIED:
            raise HTTPException(400, detail="email already registered")
        elif user["activated"] == ActivationStatus.UNVERIFIED:
            raise HTTPException(409, detail="email already registered but not verified")

        # recover deleted user
        update_data = {
            "password": password,
            "activated": ActivationStatus.UNVERIFIED,
            "token": "",
            "token_expire": datetime(1900, 1, 1).isoformat(),
        }
        supabase.table("User").update(update_data).eq(
            "user_id", user["user_id"]
        ).execute()
    else:
        # create new user
        new_user = User(email=email, password=password)
        result = supabase.table("User").insert(new_user.dict()).execute()
        user = result.data[0]

    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)

    supabase.table("User").update(
        {
            "token": "",
            "token_expire": expire.isoformat(),
            "activated": ActivationStatus.UNVERIFIED,
        }
    ).eq("user_id", user["user_id"]).execute()
    ensure_valid_subscription(user["user_id"])
    result = await send_verification_email({"email": email})
    return {
        "message": "register success, pls forward to login page",
        "email": email,
        "status": "unverified",
    }
