import io
import re
import pdfplumber
from docx import Document
from fastapi import HTTPException


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def clean_text(text: str) -> str:
    text = text.replace('\x00', '')
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)
    text = text.strip()
    if len(text) < 100:
        raise HTTPException(status_code=400, detail="Document too short or unreadable. Minimum 100 characters required.")
    if len(text) > 100000:
        text = text[:100000]
    return text


def chunk_text(text: str, chunk_size_words: int = 400, overlap_words: int = 60) -> list:
    # CHUNKING OPTIMIZATION
    # Split on ".", "\n", "Section", "Clause"
    parts = re.split(r'(?<=\.)\s+|\n+|\b(?:Section|Clause)\b', text, flags=re.IGNORECASE)
    
    chunks = []
    current_words = []
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        words = part.split()
        if not words:
            continue
            
        if len(current_words) + len(words) <= chunk_size_words:
            current_words.extend(words)
        else:
            if current_words:
                chunk_str = " ".join(current_words)
                if len(chunk_str) >= 80: # Drop chunks < 80 chars
                    chunks.append(chunk_str)
            
            # Start new chunk with overlap
            overlap_slice = current_words[-overlap_words:] if overlap_words > 0 else []
            current_words = overlap_slice + words
            
    if current_words:
        chunk_str = " ".join(current_words)
        if len(chunk_str) >= 80:
            chunks.append(chunk_str)
            
    # Limit: MAX 15 chunks per document
    if len(chunks) > 15:
        chunks = chunks[:15]
        
    print(f"[CHUNKER] Created {len(chunks)} chunks from document (capped at 15).")
    return chunks
