from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from pydantic import BaseModel


class ActivationStatus(int, Enum):
    DELETED = -1
    UNVERIFIED = 0
    VERIFIED = 1


class Email(BaseModel):
    email: str


class VerifyCode(BaseModel):
    email: str
    code: str


class UserCredentials(BaseModel):
    email: str
    password: str


class User(BaseModel):
    email: str = ""
    password: str = ""
    name: str = "Guest"
    profile_picture_url: str = ""
    current_plan: str = "Free"
    token: str = ""
    token_expire: str = datetime(1900, 1, 1, 0, 0, 0).isoformat()
    created_at: str = datetime.now(timezone.utc).isoformat()
    google_id: str = None
    apple_id: str = None
    activated: int = ActivationStatus.UNVERIFIED
    verification_code: int = None
    expire_time: str = datetime(1900, 1, 1, 0, 0, 0).isoformat()
    parent_password: str = None
    gender: Literal["Male", "Female", "Unset"] = "Unset"
    age: int = 3

    def get_update_data(self, current_user: dict):
        update_data = {}
        default_user = User()

        fields_to_check = ["name", "profile_picture_url", "gender", "age"]

        for field in fields_to_check:
            current_value = current_user.get(field, getattr(default_user, field))
            new_value = getattr(self, field)
            if new_value != getattr(default_user, field) and new_value != current_value:
                update_data[field] = new_value

        return update_data


class ParentPasswordInput(BaseModel):
    email: str
    password: str


class ParentPasswordChange(BaseModel):
    email: str
    password: str  # new password
    code: int  # verification code


class UpdateProfileRequest(BaseModel):
    token: str
    user_data: User
