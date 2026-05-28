import os
from dotenv import load_dotenv
from openai import OpenAI

# Load the API key from hidden .env file
load_dotenv()

# Initialize the AI Client (Connecting to OpenRouter)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


def load_bim_context() -> str:
    try:
        # Looking inside the docs folder we created
        with open("docs/bim_data.txt", "r", encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return "I cannot find this in the current BIM documentation."


def ask_laguna(user_prompt: str) -> str:

    try:
        context = load_bim_context()

        response = client.chat.completions.create(
            model="poolside/laguna-m.1:free",
            messages=[
                {"role": "system",
                 "content": f"You are a helpful BIM (Building Information Modeling) assistant. Answer the user's questions based strictly on this extracted document context:\n\n{context}\n\nIf the answer is not in the context, say 'I cannot find this in the current BIM documentation.'"},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message.content

    except Exception as e:
        return f"AI Logic Error: {str(e)}"


def stream_laguna(user_prompt: str):

    try:
        context = load_bim_context()

        response_stream = client.chat.completions.create(
            model="poolside/laguna-m.1:free",
            messages=[
                {"role": "system",
                 "content": f"You are a helpful BIM (Building Information Modeling) assistant. Answer the user's questions based strictly on this extracted document context:\n\n{context}\n\nIf the answer is not in the context, say 'I cannot find this in the current BIM documentation.'"},
                {"role": "user", "content": user_prompt}
            ],
            stream=True
        )

        for chunk in response_stream:
            if chunk.choices[0].delta.content is not None:
                text_fragment = chunk.choices[0].delta.content
                yield text_fragment

    except Exception as e:
        # If the API crashes mid-stream, yield
        yield f"\n[AI Streaming Error: {str(e)}]"