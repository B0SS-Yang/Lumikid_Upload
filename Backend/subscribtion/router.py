from fastapi import APIRouter

from .cancel_subscribtion import cancel
from .send_email import send_subscription_email
from .subscribtion import create_checkout_session, stripe_webhook

payment_router = APIRouter()

payment_router.post("/payment/purchase")(create_checkout_session)
payment_router.post("/payment/webhook")(stripe_webhook)
payment_router.post("/payment/send_email")(send_subscription_email)
payment_router.post("/payment/cancel")(cancel)
