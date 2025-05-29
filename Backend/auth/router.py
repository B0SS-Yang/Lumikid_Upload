from fastapi import APIRouter

from .delete_account import delete_account
from .google import auth_callback, google_login
from .login import login
from .parental_control import (
    change_parent_password,
    check_parent_password,
    send_parent_password_code,
    set_parent_password,
)
from .refresh_token import refresh
from .register import register
from .reset_password import reset_password, send_reset_code, verify_reset_code
from .user_info import get_me, update_profile
from .verify_email import send_verification_email, verify_code

userauth_router = APIRouter()

userauth_router.post("/auth/register")(register)
userauth_router.post("/auth/login")(login)
userauth_router.post("/auth/delete_account")(delete_account)
userauth_router.get("/auth/get_me")(get_me)
userauth_router.post("/auth/update_profile")(update_profile)
userauth_router.get("/auth/google_login")(google_login)
userauth_router.get("/auth/callback")(auth_callback)
userauth_router.post("/auth/send_reset_code")(send_reset_code)
userauth_router.post("/auth/verify_reset_code")(verify_reset_code)
userauth_router.post("/auth/reset_password")(reset_password)
userauth_router.post("/auth/set_parent_password")(set_parent_password)
userauth_router.post("/auth/check_parent_password")(check_parent_password)
userauth_router.post("/auth/send_parent_password_code")(send_parent_password_code)
userauth_router.post("/auth/change_parent_password")(change_parent_password)
userauth_router.post("/auth/refresh")(refresh)
userauth_router.post("/auth/send_verification_email")(send_verification_email)
userauth_router.post("/auth/verify_code")(verify_code)
