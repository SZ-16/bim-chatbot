from fastapi import FastAPI
from pydantic import BaseModel
import sys
import os

# This helps Python find your 'ai' folder
from ai_engine import ask_laguna

app = FastAPI()

class ChatRequest(BaseModel):
    prompt: str
    context: str = ""

@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    answer = ask_laguna(request.prompt, request.context)
    return {"answer": answer}