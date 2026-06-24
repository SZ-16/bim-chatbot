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
    if history is None:
        history = []

    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/chat/completions"

    document_context = load_document_context(file_path)

    system_instruction = """
    You are an intelligent assistant for a BIM (Building Information Modeling) platform.

    CRITICAL FORMATTING RULE: 
    Write in continuous, well-structured paragraphs. Do NOT use single line breaks. Let sentences wrap naturally. Use markdown bullet points ONLY when listing specific items.

    CRITICAL INSTRUCTIONS FOR INTENT DETECTION:
    1. CHARTS: If the user explicitly asks for a chart, graph, or visual data representation, you MUST include a JSON block enclosed in <chart> tags anywhere in your response. 
       Example: <chart>{"type": "bar", "title": "LOD Distribution", "labels": ["LOD 200", "LOD 300"], "values": [150, 350]}</chart>
       Supported types: "bar", "pie".
    2. DOCUMENTS: If the user explicitly asks to generate a report, document, or export data, you MUST wrap the complete, formal report text in <document> tags.
       Example: <document># Site Report\n\nEverything looks good...</document>

    General Rules:
    - Prioritize answering using the provided CONTEXT.
    - If the user asks about the conversation itself, use the conversation history.
    """

    messages_payload = [{"role": "system", "content": system_instruction}]

    for msg in history[-10:]:
        if msg.get("content", "").strip() and msg.get("content") != "...":
            messages_payload.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

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