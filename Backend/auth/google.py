import os
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse

from utils import (
    ACCESS_TOKEN_EXPIRE_SECONDS,
    create_jwt_token,
    ensure_valid_subscription,
    supabase,
)

from .schemas import ActivationStatus

# google OAuth 2.0 configuration

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")


async def google_login():
    #  Google OAuth 2.0 URL
    return RedirectResponse(
        url=(
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={GOOGLE_CLIENT_ID}"
            f"&response_type=code"
            f"&scope=openid%20email%20profile"
            f"&redirect_uri={REDIRECT_URI}"
            f"&access_type=offline"
            f"&prompt=consent"
        )
    )


async def auth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code in request")

    # Exchange the code for an access token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=data)
        token_resp.raise_for_status()
        tokens = token_resp.json()

        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to obtain access token")

        # Use the access token to get user information
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo_resp.raise_for_status()
        user_info = userinfo_resp.json()

    email = user_info.get("email")
    name = user_info.get("name", "Guest")
    picture = user_info.get("picture", "")
    google_id = user_info.get("id")

    # Check if the user already exists in the database
    response = supabase.table("User").select("*").eq("email", email).execute()
    if response.data:
        # Update user information
        supabase.table("User").update(
            {
                "name": name,
                "profile_picture_url": picture,
                "google_id": google_id,
                "activated": ActivationStatus.VERIFIED,
            }
        ).eq("email", email).execute()
    else:
        # Create a new user
        supabase.table("User").insert(
            {
                "email": email,
                "name": name,
                "profile_picture_url": picture,
                "google_id": google_id,
                "activated": ActivationStatus.VERIFIED,
            }
        ).execute()
    user = supabase.table("User").select("*").eq("email", email).execute().data[0]
    token = create_jwt_token(user["user_id"])
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)

    supabase.table("User").update(
        {"token": token, "token_expire": expire.isoformat()}
    ).eq("user_id", user["user_id"]).execute()
    ensure_valid_subscription(user["user_id"])
    return {"access_token": token, "token_type": "bearer"}
