import re
from typing import List, Tuple

from .api_configration import openai_client


def normalize_answer(ans: str) -> str:
    if not ans:
        return ""
    return re.sub(r"[^a-zA-Z0-9]", "", ans).lower()


def get_embedding(text: str) -> List[float]:
    """Get text embedding using OpenAI API"""
    response = openai_client.embeddings.create(
        input=text, model="text-embedding-3-large", dimensions=3072
    )
    return response.data[0].embedding


def check_content_safety(text: str) -> bool:
    """Check content safety using OpenAI's moderation endpoint"""
    try:
        response = openai_client.moderations.create(input=text)
        return not response.results[0].flagged
    except Exception:
        return False


def parse_question_answer(text: str) -> Tuple[str, str]:
    lines = text.strip().split("\n")
    question_line = next((l for l in lines if l.lower().startswith("question:")), None)
    answer_line = next((l for l in lines if l.lower().startswith("answer:")), None)
    if not question_line or not answer_line:
        raise ValueError("GPT output missing 'Question:' or 'Answer:'")
    question = question_line.split(":", 1)[1].strip()
    answer = answer_line.split(":", 1)[1].strip()
    return question, answer
