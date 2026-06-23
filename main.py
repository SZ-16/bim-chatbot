import os
<<<<<<< Updated upstream
import jwt
from datetime import datetime, timedelta, timezone
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
=======
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
>>>>>>> Stashed changes

# Import Database tools
from databaseFile import engine, Base, get_db
import models

# Import your upgraded AI engine
from ai_engine import ask_laguna

<<<<<<< Updated upstream
limiter = Limiter(key_func=get_remote_address)
=======
# 1. Initialize FastAPI & Database Tables
Base.metadata.create_all(bind=engine)
>>>>>>> Stashed changes
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Create the Uploads Directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 4. Data Models for the API
class ChatMessageDef(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    filename: str = "bim_data.txt"
    history: List[ChatMessageDef] = []
    chat_id: Optional[int] = None  # Allows frontend to specify which chat this belongs to


# --- ROUTES ---

@app.get("/login")
async def auto_login():
    return {"token": "your_secure_jwt_token_here"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only .pdf and .txt files are allowed.")

    file_location = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

<<<<<<< Updated upstream
@app.post("/login")
@limiter.limit("10/minute")
def login_placeholder(request: Request):
    expiration_time = datetime.now(timezone.utc) + timedelta(hours=24)

    # JWT
    token_data = {"sub": "test_engineer", "exp": expiration_time}
    encoded_jwt = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)

    return {"access_token": encoded_jwt, "token_type": "bearer"}


@app.post("/chat")
@limiter.limit("20/minute")
async def chat_endpoint(
    request: Request,
    chat_request: ChatRequest,
    user: str = Depends(verify_token),
):
    if not chat_request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
=======
    return {"message": "Success", "filename": file.filename, "path": file_location}


@app.post("/chat")
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    current_chat_id = request.chat_id
>>>>>>> Stashed changes

    # 1. Check if React's specific chat ID already exists in Neon DB
    chat_record = db.query(models.Chat).filter(models.Chat.id == current_chat_id).first()

<<<<<<< Updated upstream
    return StreamingResponse(
        stream_laguna(chat_request.prompt),
        media_type="text/event-stream"
    )
=======
    # 2. If it does not exist, create the Chat first!
    if not chat_record:
        new_chat = models.Chat(id=current_chat_id, title=request.message[:30])
        db.add(new_chat)
        db.commit()
>>>>>>> Stashed changes

    # 3. Save the User's Message to Neon DB safely
    user_msg = models.Message(chat_id=current_chat_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    # 4. Handle File Path
    if request.filename != "bim_data.txt":
        file_path = os.path.join(UPLOAD_DIR, request.filename)
    else:
        file_path = "bim_data.txt"

    # 5. Ask the AI (passing the history so it remembers)
    dict_history = [{"role": msg.role, "content": msg.content} for msg in request.history]
    ai_response = ask_laguna(request.message, file_path, dict_history)

    # 6. Save the AI's Response to Neon DB
    ai_msg = models.Message(chat_id=current_chat_id, role="assistant", content=ai_response)
    db.add(ai_msg)
    db.commit()

    return {
        "response": ai_response,
        "chat_id": current_chat_id
    }