import os
import json
from dotenv import load_dotenv
from supabase import create_client
from fastapi import HTTPException
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv("../.env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
def _upsert_with_retry(records: list):
    return supabase.table("documents").upsert(records).execute()

def insert_embeddings_batch(records: list) -> None:
    formatted_records = []
    for rec in records:
        content = rec.get("content", "").strip()
        embedding = rec.get("embedding", [])
        
        # GAP 3 - SUPABASE DB RESILIENCE (Validation)
        if not content:
            print("[DB WARNING] Skipping chunk: content is empty.")
            continue
        if not isinstance(embedding, list) or len(embedding) != 768:
            length = len(embedding) if isinstance(embedding, list) else type(embedding)
            print(f"[DB WARNING] Skipping chunk: embedding length is {length}, expected 768.")
            continue
            
        rec_copy = rec.copy()
        rec_copy["embedding"] = json.dumps(embedding)
        formatted_records.append(rec_copy)
        
    if not formatted_records:
        print("[DB WARNING] No valid records to upsert in this batch.")
        return

    try:
        _upsert_with_retry(formatted_records)
        print(f"[DB SUCCESS] Upserted batch of {len(formatted_records)} chunks.")
    except Exception as e:
        error_msg = str(e).lower()
        if "row-level security" in error_msg or "403" in error_msg:
            print(f"[DB ERROR] RLS POLICY ERROR: {e}")
        else:
            print(f"[DB ERROR] Final upsert failure for batch: {e}. Skipping chunk(s).")
        # NEVER allow DB failure to crash pipeline


def search_similar(query_embedding: list, document_id: str, top_k: int = 3) -> list:
    try:
        response = supabase.rpc("match_documents", {
            "query_embedding": str(query_embedding),
            "match_count": top_k,
            "doc_id": document_id
        }).execute()
        if response.data:
            return [row["content"] for row in response.data]
        return []
    except Exception as e:
        print(f"[DB ERROR] search_similar failed: {e}")
        return []
