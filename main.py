import jwt
import re
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from auth import JWT_SECRET, ALGORITHM, verify_token
from forge.routes import router as forge_router


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


limiter = Limiter(key_func=get_remote_address)

Base.metadata.create_all(bind=engine)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forge_router)



class ChatMessageDef(BaseModel):
    role: str
    content: str

@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}


@app.post("/login")
def login_placeholder():
    expiration_time = datetime.now(timezone.utc) + timedelta(hours=24)
    token_data = {"sub": "test_engineer", "exp": expiration_time}
    encoded_jwt = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)
    return {"access_token": encoded_jwt, "token_type": "bearer"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only .pdf and .txt files are allowed.")
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    return {"message": "Success", "filename": file.filename, "path": file_location}


@app.get("/documents")
async def list_documents():
    files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(('.pdf', '.txt'))]
    return {"documents": files}

    return StreamingResponse(
        stream_laguna(request.prompt),
        media_type="text/event-stream",
    )
