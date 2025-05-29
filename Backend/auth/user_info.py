from fastapi import HTTPException

from utils import supabase, verify_jwt_token

from .schemas import UpdateProfileRequest


async def get_me(token: str):
    user_id = verify_jwt_token(token)
    user_data = supabase.table("User").select("*").eq("user_id", user_id).execute()
    return user_data.data[0]


async def update_profile(data: UpdateProfileRequest):
    token = data.token
    user_data = data.user_data
    user_id = verify_jwt_token(token)
    current_user = (
        supabase.table("User").select("*").eq("user_id", user_id).execute().data[0]
    )

    update_data = user_data.get_update_data(current_user)

    if "email" in update_data:
        existing = (
            supabase.table("User")
            .select("user_id")
            .eq("email", update_data["email"])
            .execute()
        )
        if existing.data and existing.data[0]["user_id"] != user_id:
            raise HTTPException(400, detail="email already registered")

    if update_data:
        supabase.table("User").update(update_data).eq("user_id", user_id).execute()

    return {"message": "profile updated"}
