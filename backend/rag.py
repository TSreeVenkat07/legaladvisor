import asyncio
from uuid import uuid4
from fastapi import HTTPException
from utils import extract_text_from_pdf, extract_text_from_docx, clean_text, chunk_text
from gemini import get_embedding, generate_answer, extract_text_from_image
from db import insert_embeddings_batch, search_similar


async def _embed_chunk(content: str, chunk_index: int, sem: asyncio.Semaphore) -> list | None:
    async with sem:
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, get_embedding, content, chunk_index)
        except Exception as e:
            print(f"[RAG ERROR] _embed_chunk unexpected exception for chunk {chunk_index}: {e}")
            return None


async def process_document(file_bytes: bytes, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension == "pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    elif extension == "docx":
        raw_text = extract_text_from_docx(file_bytes)
    elif extension in ["png", "jpg", "jpeg"]:
        mime_type = "image/png" if extension == "png" else "image/jpeg"
        loop = asyncio.get_event_loop()
        raw_text = await loop.run_in_executor(None, extract_text_from_image, file_bytes, mime_type)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF, DOCX, PNG, and JPG are allowed.")

    cleaned = clean_text(raw_text)
    chunks = chunk_text(cleaned)

    if not chunks:
        raise HTTPException(status_code=400, detail="Document produced no usable text chunks.")

    document_id = str(uuid4())
    print(f"[RAG] Processing {filename} → document_id={document_id}, chunks={len(chunks)}")

    semaphore = asyncio.Semaphore(5)
    tasks = [_embed_chunk(chunk, idx, semaphore) for idx, chunk in enumerate(chunks)]
    
    print(f"[RAG] Initiating {len(tasks)} embedding tasks with concurrency limit of 5...")
    results = await asyncio.gather(*tasks, return_exceptions=True)

    batch_records = []
    successful = 0
    failed = 0

    for idx, (chunk, result) in enumerate(zip(chunks, results)):
        if isinstance(result, Exception):
            print(f"[RAG ERROR] Task exception for chunk {idx}: {result}")
            failed += 1
            continue
        if result is None:
            failed += 1
            continue
            
        successful += 1
        batch_records.append({
            "document_id": document_id,
            "content": chunk,
            "embedding": result # Passed as raw list, db.py handles serialization
        })
        
    print(f"[RAG SUMMARY] Total Attempted: {len(chunks)}, Successful: {successful}, Failed: {failed}")

    if batch_records:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, insert_embeddings_batch, batch_records)
        except Exception as e:
            print(f"[RAG ERROR] DB insert failed completely: {e}")
            # Do NOT crash pipeline as per mandate
    else:
        print("[RAG WARNING] No chunks successfully embedded. Skipping DB insert.")

    print(f"[RAG] Document {document_id} ingestion phase complete.")
    return document_id


async def run_analysis(document_id: str, query: str) -> dict:
    loop = asyncio.get_event_loop()
    query_embedding = await loop.run_in_executor(None, get_embedding, query)

    # Retrieval Optimization: top_k = 3 ONLY
    similar_chunks = search_similar(query_embedding, document_id, top_k=3)

    if similar_chunks:
        # Context format: ----\nchunk 1\n----\nchunk 2\n----
        context = "----\n" + "\n----\n".join(similar_chunks) + "\n----"
        print(f"[RAG] Found {len(similar_chunks)} relevant chunks for document_id={document_id}")
    else:
        context = ""
        print(f"[RAG] No similar chunks found for document_id={document_id}")

    result = await loop.run_in_executor(None, generate_answer, query, context)
    return result
