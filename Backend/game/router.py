from fastapi import APIRouter

from .grammar_game import check_grammar_answer, generate_grammar_question_gpt
from .math_game import check_math_answer, generate_math_question_gpt
from .vocabulary_game import check_vocabulary_answer, generate_vocabulary_question_gpt

game_router = APIRouter()

game_router.post("/game/grammar")(generate_grammar_question_gpt)
game_router.post("/game/grammar_check")(check_grammar_answer)

game_router.post("/game/math")(generate_math_question_gpt)
game_router.post("/game/math_check")(check_math_answer)

game_router.post("/game/vocabulary")(generate_vocabulary_question_gpt)
game_router.post("/game/vocabulary_check")(check_vocabulary_answer)
