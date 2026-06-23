import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import JWT_SECRET, ALGORITHM, verify_token
from forge.routes import router as forge_router

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forge_router)


class ChatRequest(BaseModel):
    prompt: str


@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}


@app.post("/login")
def login_placeholder():
    expiration_time = datetime.now(timezone.utc) + timedelta(hours=24)
    token_data = {"sub": "test_engineer", "exp": expiration_time}
    encoded_jwt = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)
    return {"access_token": encoded_jwt, "token_type": "bearer"}


@app.post("/chat")
async def chat_endpoint(request: ChatRequest, user: str = Depends(verify_token)):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    from ai_engine import stream_laguna

    return StreamingResponse(
        stream_laguna(request.prompt),
        media_type="text/event-stream",
    )
