import os
import random
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException

from auth.schemas import ActivationStatus

from .api_configration import supabase

# jwt config
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_SECONDS = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", 25200)
)  # 7 hours
CODE_EXPIRE_SECONDS = int(os.getenv("CODE_EXPIRE_SECONDS", 3600))  # 1 hour


# JWT tools
def create_jwt_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    payload = {
        "user_id": user_id,
        "exp": int(expire.timestamp()),
        "rnd": random.randint(100000, 999999),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(401, detail="Invalid token")

        user_data = (
            supabase.table("User").select("activated").eq("user_id", user_id).execute()
        )

        if (
            not user_data.data
            or user_data.data[0]["activated"] == ActivationStatus.DELETED
        ):
            raise HTTPException(401, detail="Account not exists")

        if datetime.fromtimestamp(payload["exp"], timezone.utc) < datetime.now(
            timezone.utc
        ):
            raise HTTPException(401, detail="Token expired")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, detail="Invalid token")
