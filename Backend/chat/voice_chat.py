import traceback
from datetime import datetime
from tempfile import NamedTemporaryFile
from typing import Optional

import edge_tts
from fastapi import Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from faster_whisper import WhisperModel

from utils import get_api_key

from .aichat import generate_chat_response
from .chat_history import get_or_create_chat_record, update_chat_record
from .schemas import ChatRequest


def build_chat_request(
    transcript: str,
    user_id: int,
    age: int,
    language: str,
    interests: str,
    chat_id: Optional[int],
) -> ChatRequest:
    return ChatRequest(
        id=chat_id,
        chatID=chat_id,
        user_id=user_id,
        message=transcript,
        age=age,
        language=language,
        interests=[i.strip() for i in interests.split(",")] if interests else [],
    )


def save_uploaded_audio(file: UploadFile) -> str:
    with NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
        tmp_audio.write(file.file.read())
        return tmp_audio.name


def transcribe_audio(audio_path: str, model_name: str = "base") -> str:
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio_path)
    transcript = "".join([seg.text for seg in segments]).strip()
    return transcript


async def synthesize_audio(text: str, voice: str, audio_path: str) -> str:
    tts = edge_tts.Communicate(text=text, voice=voice)
    mp3_path = f"{audio_path}.mp3"
    await tts.save(mp3_path)
    return mp3_path


async def process_chat_logic(request_data: ChatRequest) -> str:
    chat_record = get_or_create_chat_record(
        request_data.user_id, request_data.id or request_data.chatID
    )
    conversation_json = chat_record.get("chat", {"messages": []})

    if not conversation_json["messages"]:
        conversation_json["messages"].append(
            {
                "role": "system",
                "content": (
                    f"You are a helpful and friendly AI tutor for children around {request_data.age} years old. "
                    f"Please reply in {request_data.language}, keeping your response simple, educational, and age-appropriate. "
                    f"The child's interests include: {', '.join(request_data.interests) if request_data.interests else 'general topics'}."
                ),
                "timestamp": datetime.now().isoformat(),
            }
        )

    conversation_json["messages"].append(
        {
            "role": "user",
            "content": request_data.message,
            "timestamp": datetime.now().isoformat(),
        }
    )

    ai_response = generate_chat_response(conversation_json["messages"])

    conversation_json["messages"].append(
        {
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now().isoformat(),
        }
    )

    update_chat_record(chat_record["id"], conversation_json)

    return ai_response


async def voicechat(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    age: int = Form(5),
    language: str = Form("en"),
    interests: Optional[str] = Form(""),
    chat_id: Optional[int] = Form(None),
    model_name: str = Form("base"),
    tts_voice: Optional[str] = Form(None),
    use_tts: bool = Form(True),
    api_key: str = Depends(get_api_key),
):
    try:
        audio_path = save_uploaded_audio(file)
        transcript = transcribe_audio(audio_path, model_name)
        request_data = build_chat_request(
            transcript, user_id, age, language, interests, chat_id
        )
        ai_response = await process_chat_logic(request_data)

        if not use_tts:
            return JSONResponse(content={"text": ai_response})

        voice = tts_voice or "en-US-JennyNeural"
        mp3_path = await synthesize_audio(ai_response, voice, audio_path)
        return StreamingResponse(open(mp3_path, "rb"), media_type="audio/mpeg")
    except Exception as e:
        traceback.print_exc()
        raise e
