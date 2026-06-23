import os
import requests
from dotenv import load_dotenv
import PyPDF2

load_dotenv()


# 1. Advanced Document Loader
def load_document_context(file_path="bim_data.txt"):
    try:
        if not os.path.exists(file_path):
            return f"Error: File '{file_path}' not found."

        if file_path.endswith('.txt'):
            with open(file_path, "r", encoding="utf-8") as file:
                return file.read()

        elif file_path.endswith('.pdf'):
            text_content = ""
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text_content += extracted + "\n"
            return text_content

        else:
            return "Error: Unsupported file format."

    except Exception as e:
        return f"Error reading document: {str(e)}"


# 2. The Memory-Enabled AI Logic
def ask_laguna(question: str, file_path: str = "bim_data.txt", history: list = None):
    # Ensure history is an empty list if nothing is passed
    if history is None:
        history = []

    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/chat/completions"

    # Grab the context from the PDF
    document_context = load_document_context(file_path)

    # THE FIX: Relaxed System Prompt allowing it to answer questions about the chat!
    system_instruction = """
    You are an expert Technical Evaluator and Data Analyst.
    You have access to both the uploaded document (CONTEXT) and the recent conversation history.

    1. If the user asks a technical question, answer using ONLY the provided CONTEXT. Extract exact numerical data where possible.
    2. If the user asks about the conversation itself (e.g., "what did I ask earlier?", "repeat that"), use the conversation history to answer them directly.
    3. If the answer cannot be found in either the context or the history, say 'I cannot find this in the current documentation.'
    """

    # Start building the JSON package with the system rules
    messages_payload = [{"role": "system", "content": system_instruction}]

    # THE FIX: Inject the last 10 messages of the conversation history
    for msg in history[-10:]:
        # Ignore empty messages or the "..." loading bubble
        if msg.get("content", "").strip() and msg.get("content") != "...":
            messages_payload.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    # Finally, inject the brand new question wrapped in the PDF context
    full_prompt = f"CONTEXT:\n{document_context}\n\nUSER QUESTION: {question}"
    messages_payload.append({"role": "user", "content": full_prompt})

    payload = {
        "model": "poolside/laguna-m.1:free",
        "messages": messages_payload,
        "temperature": 0.1
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