import asyncio
from functools import wraps

from fastapi import HTTPException

# Busy flag decorator
busy_flags = {}


def with_busy_flag(name: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if name not in busy_flags:
                raise HTTPException(
                    429, detail=f"{name} is busy, please try again later"
                )
            busy_flags[name] = True
            try:
                result = func(*args, **kwargs)
                if asyncio.iscoroutine(result):
                    result = await result
                return result
            finally:
                busy_flags[name] = False

        return wrapper

    return decorator
