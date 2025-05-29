from utils import check_content_safety, openai_client


def generate_chat_response(messages: list[dict]) -> str:
    ai_response = (
        openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
        )
        .choices[0]
        .message.content
    )

    if not check_content_safety(ai_response):
        return "I'm sorry, I can't respond to that. Let's talk about something else!"
    return ai_response
