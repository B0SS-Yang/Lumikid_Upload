import asyncio
from datetime import datetime, timedelta, timezone

from .api_configration import supabase
from .valid_subscription import ensure_valid_subscription


async def daily_checker():
    subscription_check()
    while True:
        now = datetime.now(timezone.utc)
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        sleep_seconds = (tomorrow - now).total_seconds()
        await asyncio.sleep(sleep_seconds)
        subscription_check()


def subscription_check():
    async def check():
        users = supabase.table("User").select("user_id").execute().data
        for u in users:
            ensure_valid_subscription(u["user_id"])

    asyncio.create_task(check())
