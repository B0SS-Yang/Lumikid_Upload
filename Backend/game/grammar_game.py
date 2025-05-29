# grammar_game.py

"""
Grammar Multiple Choice module
Function: Generate a grammar question with spaces from GPT, with a) b) c) three options
The child needs to choose the correct grammatical form (return to one of a/b/c)
"""

from typing import Tuple

from utils import normalize_answer, openai_client, parse_question_answer

from .to_supabase import save_to_supabase


async def generate_grammar_question_gpt(user_id: int) -> Tuple[str, str]:
    """
    Generate multiple-choice questions for grammar (using GPT)
    Prompt Requirements:
      -For children aged 5-7
      -Options must use a), b), c) format
      -The format must contain Question: and Answer:
    """
    prompt = (
        "Create a grammar multiple choice question for a 5-7 year old. "
        "Use a), b), c) style for the options. "
        "Format:\nQuestion: <sentence with ___ a) xxx b) yyy c) zzz>\nAnswer: <letter only, e.g., b)>"
    )

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a kid-friendly educational assistant.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=200,
    )

    content = response.choices[0].message.content.strip()
    game_data = {"content": content}
    save_to_supabase(user_id=user_id, game_data=game_data)
    return parse_question_answer(content)


async def check_grammar_answer(user_input: str, correct_answer: str) -> bool:
    """
    Determine whether user input is equal to the correct answer (ignoring the difference in case and format)
    Example: User input "B", "b)" or "b" can be recognized as b
    """
    return normalize_answer(user_input) == normalize_answer(correct_answer)
