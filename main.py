import os
import jwt
from datetime import datetime, timedelta, timezone
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Security Configuration ---
JWT_SECRET = "super-secret-bim-key-do-not-share"
ALGORITHM = "HS256"

# This tells FastAPI where the frontend should go to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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


class ChatRequest(BaseModel):
    prompt: str


# --- The Bouncer (Dependency) ---
def verify_token(token: str = Depends(oauth2_scheme)):
    """This function intercepts requests and checks the VIP wristband."""
    try:
        # Try to decode the mathematical signature
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")  # Returns the username if successful
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")


# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}


@app.post("/login")
def login_placeholder():

    expiration_time = datetime.now(timezone.utc) + timedelta(hours=24)

    # JWT
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
        media_type="text/event-stream"
    )

