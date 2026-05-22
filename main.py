from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine import ask_laguna

app = FastAPI()

# --- CORS Security Clearance ---
# Tell the backend to trust requests coming from the Angular frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers to pass through
)
# -------------------------------

class ChatRequest(BaseModel):
    prompt: str

@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    answer = ask_laguna(request.prompt)
    return {"answer": answer}