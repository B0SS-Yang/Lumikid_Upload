import os
from datetime import datetime, timedelta, timezone

import stripe
from fastapi import HTTPException, Request

from utils import get_current_subscription, supabase, verify_jwt_token

from .schemas import PurchaseRequest
from .send_email import send_subscription_email

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_DOMAIN = os.getenv("STRIPE_DOMAIN")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
stripe.api_key = STRIPE_SECRET_KEY


async def create_checkout_session(data: PurchaseRequest):
    user_id = verify_jwt_token(data.token)
    user_email = (
        supabase.table("User")
        .select("email")
        .eq("user_id", user_id)
        .execute()
        .data[0]["email"]
    )

    if data.plan == "Free":
        raise HTTPException(
            status_code=400, detail="Free plan does not require payment"
        )

    try:
        # all price id
        price_map_auto = {
            ("Pro", "monthly"): "price_1ROUraPi2NYp3v9QuhPnOHdA",  # auto renew monthly
            ("Pro", "yearly"): "price_1ROUrbPi2NYp3v9Qnkd0ZbTm",
            ("Pro", "quarterly"): "price_1RRQquPi2NYp3v9QQFDRwMed",
        }
        price_map_one_time = {
            ("Pro", "monthly"): "price_1ROYBvPi2NYp3v9QNH1ugpuy",  # one time
            ("Pro", "yearly"): "price_1ROYC4Pi2NYp3v9QIXBeBX6S",
        }

        price_map = price_map_auto if data.auto_renew else price_map_one_time
        price_id = price_map.get((data.plan, data.duration))
        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid plan or duration")

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription" if data.auto_renew else "payment",
            customer_email=user_email,
            metadata={
                "user_id": str(user_id),
                "plan": data.plan,
                "duration": data.duration,
                "auto_renew": str(data.auto_renew),
                "renew_method": data.renew_method,
            },
            success_url=STRIPE_DOMAIN + "/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=STRIPE_DOMAIN + "/cancel",
        )

        return {"checkout_url": session.url}

    except Exception as e:
        raise e


async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan = session["metadata"]["plan"]
        duration = session["metadata"]["duration"]
        auto_renew = session["metadata"]["auto_renew"] == "True"
        renew_method = session["metadata"]["renew_method"]

        now = datetime.now(timezone.utc)

        pre_plan = "Free"

        sub = get_current_subscription(user_id)
        expire_base = now

        if sub and sub.get("status") and sub.get("expire_at") and sub["plan"] != "Free":
            sub_expire = datetime.fromisoformat(sub["expire_at"])
            if sub_expire > now:
                expire_base = sub_expire
        expire = expire_base + timedelta(days=365 if duration == "yearly" else 30)
        if sub:
            pre_plan = sub["plan"]
            supabase.table("subscription").update(
                {
                    "plan": plan,
                    "status": True,
                    "created_at": now.isoformat(),
                    "expire_at": expire.isoformat(),
                    "auto_renew": auto_renew,
                    "next_billing_date": expire.isoformat(),
                    "next_billing_method": renew_method,
                }
            ).eq("user_id", user_id).execute()
            sub_id = sub["id"]
        else:
            result = (
                supabase.table("subscription")
                .insert(
                    {
                        "user_id": user_id,
                        "plan": plan,
                        "status": True,
                        "created_at": now.isoformat(),
                        "expire_at": expire.isoformat(),
                        "auto_renew": auto_renew,
                        "next_billing_date": expire.isoformat(),
                        "next_billing_method": renew_method,
                    }
                )
                .execute()
            )
            sub_id = result.data[0]["id"]

        supabase.table("sub_history").insert(
            {
                "sub_id": sub_id,
                "pre_plan": pre_plan,
                "new_plan": plan,
                "created_at": now.isoformat(),
                "user_id": user_id,
            }
        ).execute()

        supabase.table("User").update({"current_plan": plan}).eq(
            "user_id", user_id
        ).execute()
        user_result = (
            supabase.table("User").select("email").eq("user_id", user_id).execute()
        )
        user_email = user_result.data[0]["email"] if user_result.data else None
        if user_email:
            send_subscription_email(user_email, plan, duration, expire)

    return {"status": "success"}
