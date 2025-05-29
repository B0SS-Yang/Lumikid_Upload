import asyncio
import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from auth import userauth_router
from chat import chat_router
from game import game_router
from library import library_router
from subscribtion import payment_router
from utils import daily_checker


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(daily_checker())  # Start background tasks

    yield


app = FastAPI(lifespan=lifespan)

# Settings allow cross-domain (can be modified as needed)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userauth_router)
app.include_router(payment_router)
app.include_router(library_router)
app.include_router(chat_router)
app.include_router(game_router)


@app.post("/check_connnection")
async def check_connnection():
    return {"message": "Connection established"}


if __name__ == "__main__":
    host = os.getenv("SERVICE_URL")
    port = int(os.getenv("SERVICE_PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True, log_level="debug")
