from datetime import datetime, timezone

from fastapi import HTTPException

from utils import get_current_subscription, supabase, verify_jwt_token

from .schemas import TokenRequest


async def cancel(data: TokenRequest):
    user_id = verify_jwt_token(data.token)
    now = datetime.now(timezone.utc)

    sub = get_current_subscription(user_id)
    if not sub:
        raise HTTPException(400, detail="No active subscription found")

    supabase.table("subscription").update({"plan": "Free"}).eq(
        "user_id", user_id
    ).execute()

    supabase.table("sub_history").insert(
        {
            "sub_id": sub["id"],
            "pre_plan": sub["plan"],
            "new_plan": "Free",
            "created_at": now.isoformat(),
            "user_id": user_id,
        }
    ).execute()

    supabase.table("User").update({"current_plan": "Free"}).eq(
        "user_id", user_id
    ).execute()

    return {"message": "Subscription cancelled"}
