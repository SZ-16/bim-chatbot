import os
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine import ask_laguna

app = FastAPI()

#  CORS Security Clearance 
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


#  Data Models
class ChatRequest(BaseModel):
    prompt: str


#  Endpoints 

@app.get("/")
def health_check():
    return {"status": "BIM Bot is Online"}


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Check if the user sent an empty message
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

        answer = ask_laguna(request.prompt)

        # Catch our custom AI Logic errors from ai_engine.py
        if "AI Logic Error" in answer or "Error:" in answer:
            raise HTTPException(status_code=502, detail=answer)

        return {"answer": answer}

    except HTTPException:
        raise  # Pass custom exceptions straight through
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {str(e)}")


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        os.makedirs("docs", exist_ok=True)
        content_to_add = ""

        # 1. Reject massive files (e.g., over 10MB) to save memory
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File is too large. Maximum size is 10MB.")

        # 2. Process Text Files
        if file.filename.endswith(".txt"):
            content_to_add = (await file.read()).decode("utf-8")

        # 3. Process PDF Files
        elif file.filename.endswith(".pdf"):
            try:
                pdf_reader = PdfReader(file.file)
                for page in pdf_reader.pages:
                    # Some PDFs have images instead of text, which returns None
                    extracted = page.extract_text()
                    if extracted:
                        content_to_add += extracted + "\n"
            except Exception:
                raise HTTPException(status_code=422, detail="Could not read PDF. It might be corrupted or image-based.")

        else:
            raise HTTPException(status_code=415, detail="Unsupported file type. Please upload .txt or .pdf")

        # 4. Check if the file was completely empty
        if not content_to_add.strip():
            raise HTTPException(status_code=400, detail="The uploaded file contains no readable text.")

        # 5. Append to the Knowledge Base
        with open("docs/bim_data.txt", "a", encoding="utf-8") as f:
            f.write(f"\n\n SOURCE: {file.filename} \n")
            f.write(content_to_add)

        return {"filename": file.filename, "status": "Successfully processed and added to AI Knowledge Base!"}

    except HTTPException:
        raise
    except Exception as e:
        # Catch any other random crashes during upload
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")