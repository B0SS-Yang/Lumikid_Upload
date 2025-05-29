from fastapi import HTTPException

from utils import Emails

from .schemas import SubscriptionEmail


async def send_subscription_email(data: SubscriptionEmail):
    email = data.email
    plan = data.plan
    duration = data.duration
    expire_time = data.expire_time

    with open("templates/subscribtion_confirm.html", "r", encoding="utf-8") as f:
        template = f.read()
    html_content = template.format(
        plan=plan, duration=duration, time=expire_time.strftime("%Y-%m-%d %H:%M:%S")
    )
    try:
        email = Emails.send(
            from_="no-reply@lumikid.site",
            to=[email],
            subject="Subscription Confirmation",
            html=html_content,
        )
    except RuntimeError as e:
        return HTTPException(status_code=422, detail=str(e))
    return {"status": "success"}
