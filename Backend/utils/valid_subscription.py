from datetime import datetime, timezone

from .api_configration import supabase


def get_current_subscription(user_id: int):
    sub = (
        supabase.table("subscription").select("*").eq("user_id", user_id).execute().data
    )
    if sub:
        return sub[0]
    return None


def ensure_valid_subscription(user_id: int):
    sub = get_current_subscription(user_id)
    now = datetime.now(timezone.utc)

    if (
        not sub
        or not sub["status"]
        or (sub["expire_at"] and datetime.fromisoformat(sub["expire_at"]) < now)
    ):
        supabase.table("User").update({"current_plan": "Free"}).eq(
            "user_id", user_id
        ).execute()
        if sub:
            supabase.table("subscription").update({"status": False}).eq(
                "user_id", user_id
            ).execute()
            sub_id = sub["id"]
        else:
            result = (
                supabase.table("subscription")
                .insert(
                    {
                        "user_id": user_id,
                        "plan": "Free",
                        "status": True,
                        "created_at": now.isoformat(),
                        "expire_at": None,
                        "auto_renew": False,
                        "next_billing_date": None,
                        "next_billing_method": "",
                    }
                )
                .execute()
            )
            sub_id = result.data[0]["id"]

        supabase.table("sub_history").insert(
            {
                "sub_id": sub_id,
                "pre_plan": sub["plan"] if sub else "",
                "new_plan": "Free",
                "created_at": now.isoformat(),
                "user_id": user_id,
            }
        ).execute()
