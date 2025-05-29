import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from utils import CODE_EXPIRE_SECONDS, Emails, supabase

from .schemas import ActivationStatus, Email, VerifyCode


async def send_verification_email(email: Email):
    # Check if email format is valid (optional, use a proper email validation)
    if type(email) is dict:
        email = email["email"]
    elif type(email) is Email:
        email = email.email
    else:
        raise HTTPException(400, detail="Invalid data format")
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    result = supabase.table("User").select("*").eq("email", email).execute()
    if not result.data or result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(
            status_code=400, detail="email not registered or account deleted"
        )
    if result.data[0]["activated"] == ActivationStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="email already verified")

    # Generate a verification code
    verification_code = random.randint(100000, 999999)
    expire_time = datetime.now(timezone.utc) + timedelta(seconds=CODE_EXPIRE_SECONDS)

    # Create the email content (you can customize this part)
    with open("templates/verify_email.html", "r", encoding="utf-8") as f:
        template = f.read()
    html_content = template.format(code=verification_code)
    try:
        Emails.send(
            from_="no-reply@lumikid.site",
            to=[email],
            subject="Email Verification",
            html=html_content,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    update_data = {
        "verification_code": verification_code,
        "expire_time": expire_time.isoformat(),
    }
    result = supabase.table("User").update(update_data).eq("email", email).execute()
    # You can log or handle the result from Resend API here if needed
    return {"message": "Verification email sent", "status": "success", "email": email}


async def verify_code(data: VerifyCode):
    email = data.email
    code = data.code
    timenow = datetime.now(timezone.utc)

    # Retrieve stored verification code from the database
    result = supabase.table("User").select("*").eq("email", email).execute()
    print(
        result.data[0]["verification_code"],
        code,
        type(code),
        type(result.data[0]["verification_code"]),
    )

    if not result.data or str(result.data[0]["verification_code"]) != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    # Check if the code is expired
    if timenow > datetime.fromisoformat(result.data[0]["expire_time"]):
        raise HTTPException(status_code=400, detail="Verification code expired")
    if result.data[0]["activated"] == ActivationStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Email already verified")
    if result.data[0]["activated"] == ActivationStatus.DELETED:
        raise HTTPException(status_code=400, detail="Account not exists")

    # You can mark the email as verified in the database here
    supabase.table("User").update({"activated": ActivationStatus.VERIFIED}).eq(
        "email", email
    ).execute()
    return {"message": "Email verified successfully", "status": "success"}
