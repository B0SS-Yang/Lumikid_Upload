import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from utils import CODE_EXPIRE_SECONDS, Emails, supabase

from .schemas import ActivationStatus, Email, ParentPasswordChange, ParentPasswordInput


async def set_parent_password(data: ParentPasswordInput):
    email = data.email
    password = data.password

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] != ActivationStatus.VERIFIED:
        raise HTTPException(
            status_code=400, detail="Account does not exist, or not verified"
        )

    if result.data[0].get("parent_password"):
        raise HTTPException(status_code=400, detail="Parent password is already set")

    supabase.table("User").update({"parent_password": password}).eq(
        "email", email
    ).execute()

    return {"message": "Parent password set successfully", "status": "success"}


async def check_parent_password(data: ParentPasswordInput):
    email = data.email
    password = data.password

    result = (
        supabase.table("User")
        .select("parent_password", "activated")
        .eq("email", email)
        .execute()
    )
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(status_code=400, detail="Account does not exist")

    parent_password = result.data[0].get("parent_password")

    # Treat empty/missing password as incorrect
    if not parent_password or parent_password != password:
        return {"message": "Incorrect parent password", "status": "fail"}

    return {"message": "Parent password verified", "status": "success"}


async def send_parent_password_code(email: Email):
    if isinstance(email, dict):
        email = email["email"]
    elif isinstance(email, Email):
        email = email.email
    else:
        raise HTTPException(400, detail="Invalid data format")

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(status_code=400, detail="Account does not exist")

    user = result.data[0]
    if user["activated"] != ActivationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")

    verification_code = random.randint(100000, 999999)
    expire_time = datetime.now(timezone.utc) + timedelta(seconds=CODE_EXPIRE_SECONDS)

    with open("templates/parent_password.html", "r", encoding="utf-8") as f:
        template = f.read()
    html_content = template.format(code=verification_code)

    try:
        Emails.send(
            from_="no-reply@lumikid.site",
            to=[email],
            subject="Parent Password Change Verification",
            html=html_content,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    supabase.table("User").update(
        {"verification_code": verification_code, "expire_time": expire_time.isoformat()}
    ).eq("email", email).execute()

    return {"message": "Verification code sent", "status": "success"}


async def change_parent_password(data: ParentPasswordChange):
    email = data.email
    new_password = data.password
    code = data.code

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(status_code=400, detail="Account does not exist")

    user = result.data[0]
    if user["activated"] != ActivationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="Account not verified")

    if user["verification_code"] != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if datetime.now(timezone.utc) > datetime.fromisoformat(user["expire_time"]):
        raise HTTPException(status_code=400, detail="Verification code expired")

    supabase.table("User").update({"parent_password": new_password}).eq(
        "email", email
    ).execute()

    return {"message": "Parent password updated", "status": "success"}
