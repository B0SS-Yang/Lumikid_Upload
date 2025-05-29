# math_game.py

"""
Math Question Game
Function: Use GPT to generate a simple math problem (suitable for children aged 5-7), and perform fuzzy matching of user input.
Design structure:
-Supports injected GPT clients
-Independent Generation Function + Question Diligence Function
-Keep the prompt structure consistent with the main project
"""

from typing import Tuple

from utils import normalize_answer, openai_client, parse_question_answer

from .to_supabase import save_to_supabase


async def generate_math_question_gpt(user_id: int) -> Tuple[str, str]:
    """
    Call GPT to generate math problems
    Use fixed prompt to generate standard format questions and answers
    Return: (Question string, answer string)
    """
    prompt = (
        "Create one math question for a 5-7 year old child. "
        "Respond only in this format:\n"
        "Question: <text>\n"
        "Answer: <only the number, no unit or word>"
    )

    response = openai_client.chat.completions.create(
        model="GPT cho",
        messages=[
            {
                "Role": "System",
                "Content": "You are a kid-friendly educational assistant.",
            },
            {"Role": "User", "Content": prompt},
        ],
        temperature=0.5,
        max_tokens=200,
    )

    content = response.choices[0].message.content.strip()
    game_date = {"Content": content}
    save_to_supabase(user_id=user_id, game_data=game_date)
    return parse_question_answer(content)


async def check_math_answer(user_input: str, correct_answer: str) -> bool:
    """
    Determine whether user input is equal to the correct answer (supports fuzzy matching)
    Even if the user inputs non-numeric characters such as spaces, symbols, etc., it can be correctly identified.
    """
    return normalize_answer(user_input) == normalize_answer(correct_answer)
