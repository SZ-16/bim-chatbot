import os
import requests
from dotenv import load_dotenv

load_dotenv()


# 1. Read the BIM document
def load_bim_context():
    try:
        # Make sure this matches where you put the txt file!
        with open("bim_data.txt", "r", encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return "Error: BIM data file not found."


# 2. The upgraded AI logic
def ask_laguna(question: str):
    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/chat/completions"

    # Grab the context from our file
    bim_context = load_bim_context()

    # The System Prompt: This is where you program the AI's personality and rules
    system_instruction = """
    You are an expert strict BIM (Building Information Modeling) Coordinator. 
    You must answer the user's questions using ONLY the context provided below. 
    If the answer is not in the context, say 'I cannot find this in the current BIM documentation.'
    """

    # We inject both the context and the user's question
    full_prompt = f"CONTEXT:\n{bim_context}\n\nUSER QUESTION: {question}"

    payload = {
        "model": "poolside/laguna-m.1:free",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": full_prompt}
        ],
        "temperature": 0.2  # Low temperature keeps it factual and prevents hallucinations
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
        return f"AI Logic Error: {str(e)}"