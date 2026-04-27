import os
from dotenv import load_dotenv

load_dotenv("../.env")

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import process_document, run_analysis

from config import origin

app = FastAPI(title="AI Legal Document Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "png", "jpg", "jpeg"}


class AnalyzeRequest(BaseModel):
    document_id: str
    query: str = "Analyze this legal document fully"


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "legal-ai-analyzer"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PNG, and JPG files are allowed.")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        document_id = await process_document(file_bytes, file.filename)
        return {"document_id": document_id, "message": f"Document '{file.filename}' processed successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to process document. Please try again.")


@app.post("/analyze")
async def analyze_document(request: AnalyzeRequest):
    if not request.document_id or not request.document_id.strip():
        raise HTTPException(status_code=400, detail="document_id is required.")

    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="query is required.")

    try:
        result = await run_analysis(request.document_id, request.query)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ANALYZE ERROR] {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")
