from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PurchaseRequest(BaseModel):
    token: str
    plan: Literal["Free", "Pro"]
    duration: Literal["monthly", "yearly", "quarterly"] = "monthly"
    auto_renew: bool = True
    renew_method: str = "credit_card"


class SubscriptionEmail(BaseModel):
    email: str
    plan: str
    duration: str
    expire_time: datetime


class TokenRequest(BaseModel):
    token: str
