import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from utils import CODE_EXPIRE_SECONDS, Emails, supabase

from .schemas import ActivationStatus, Email, UserCredentials, VerifyCode


async def send_reset_code(email: Email):
    if type(email) is dict:
        email = email["email"]
    elif type(email) is Email:
        email = email.email
    else:
        raise HTTPException(400, detail="Invalid data format")

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(400, detail="Account does not exist")

    verification_code = random.randint(100000, 999999)
    expire_time = datetime.now(timezone.utc) + timedelta(seconds=CODE_EXPIRE_SECONDS)

    with open("templates/reset_password.html", "r", encoding="utf-8") as f:
        template = f.read()
    html_content = template.format(code=verification_code)

    try:
        Emails.send(
            from_="no-reply@lumikid.site",
            to=[email],
            subject="Password Reset Code",
            html=html_content,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    supabase.table("User").update(
        {
            "verification_code": verification_code,
            "expire_time": expire_time.isoformat(),
            "reset_verified": False,
        }
    ).eq("email", email).execute()

    return {"message": "Reset code sent", "status": "success"}


async def verify_reset_code(data: VerifyCode):
    email = data.email
    code = data.code
    now = datetime.now(timezone.utc)

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(400, detail="Account does not exist")

    record = result.data[0]

    if str(record["verification_code"]) != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if now > datetime.fromisoformat(record["expire_time"]):
        raise HTTPException(status_code=400, detail="Verification code expired")

    supabase.table("User").update({"reset_verified": True}).eq("email", email).execute()
    return {"message": "Verification successful", "status": "success"}


async def reset_password(data: UserCredentials):
    email = data.email
    new_password = data.password

    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(status_code=400, detail="Account does not exist")

    user = result.data[0]
    if not user.get("reset_verified"):
        raise HTTPException(
            status_code=400,
            detail="You must verify your code before resetting password",
        )

    supabase.table("User").update(
        {"password": new_password, "reset_verified": False}
    ).eq("email", email).execute()

    return {"message": "Password reset successfully", "status": "success"}
