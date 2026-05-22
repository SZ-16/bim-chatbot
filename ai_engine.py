import os
import requests
from dotenv import load_dotenv

# This loads the key from your .env file
load_dotenv()


def ask_laguna(question: str, context: str = ""):
    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/chat/completions"

    # We tell the AI how to behave (System) and what to answer (User)
    payload = {
        "model": "poolside/laguna-m.1:free",
        "messages": [
            {"role": "system", "content": "You are a BIM expert. Answer using only the provided context."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"}
        ]
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        return f"AI Error: {str(e)}"


# Quick local test - You can run this file directly in PyCharm to test
if __name__ == "__main__":
    test_context = "The foundation of the building uses C30/37 concrete."
    test_question = "What concrete is used for the foundation?"
    print(ask_laguna(test_question, test_context))