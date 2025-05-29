# vocabulary_game.py

"""
Vocabulary Fill-in-the-Blank module
Function: Generate a sentence with fill-in-the-blanks from GPT, with three word options
Children need to choose the correct words according to semantics and fill in the blanks
"""

from typing import Tuple

from utils import normalize_answer, openai_client, parse_question_answer

from .to_supabase import save_to_supabase


async def generate_vocabulary_question_gpt(user_id: int) -> Tuple[str, str]:
    """
    Generate vocabulary fill-in-the-blank questions (using GPT to generate question stem + answer)
    Prompt Requirements:
      -For children aged 5-7
      -Do not use ABCD tags, just use 3 words options in brackets
      -Strict format requirements Question: /Answer:
    """
    prompt = (
        "Create a vocabulary fill-in-the-blank question for a 5-7 year old. "
        "DO NOT use A/B/C labels. Provide exactly 3 word options in parentheses. "
        "Format:\nQuestion: <sentence with ___ (word1, word2, word3)>\nAnswer: <correct word only>"
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
    game_data = {"Content": content}
    save_to_supabase(user_id=user_id, game_data=game_data)
    return parse_question_answer(content)


async def check_vocabulary_answer(user_input: str, correct_answer: str) -> bool:
    """
    Determine whether user input is equal to the correct answer (supports fuzzy matching)
    """
    return normalize_answer(user_input) == normalize_answer(correct_answer)
