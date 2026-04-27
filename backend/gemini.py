import os
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv("../.env")

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

# GAP 1 - NETWORK HARDENING
# The new genai SDK handles connections natively. We use v1alpha for the newest models.
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={'api_version': 'v1alpha'}
)

FALLBACK_RESPONSE = {
    "summary": "Unable to generate summary.",
    "risks": ["Analysis failed. Please retry."],
    "explanation": "Could not generate explanation."
}


def get_embedding(text: str, chunk_index: int = -1) -> list | None:
    print(f"[GEMINI] Before embedding call for chunk {chunk_index}, size: {len(text)} chars")
    
    for attempt in range(2): # Try once, retry ONCE
        try:
            # We use gemini-embedding-2 as text-embedding-004 is completely unavailable on this tier.
            result = client.models.embed_content(
                model="gemini-embedding-2",
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            
            # Extract embedding from new SDK structure
            if not result.embeddings or not result.embeddings[0].values:
                raise ValueError("Embedding returned is empty")
                
            embedding = result.embeddings[0].values
            
            # CORE EMBEDDING PIPELINE FIX (Validation)
            if not isinstance(embedding, list):
                raise ValueError("Embedding is not a list")
            if len(embedding) != 768:
                raise ValueError(f"Embedding length is {len(embedding)}, expected 768")
            if any(x is None for x in embedding):
                raise ValueError("Embedding contains None values")
            
            print(f"[GEMINI] After embedding response for chunk {chunk_index}, embedding length: {len(embedding)}")
            return embedding
            
        except Exception as e:
            if attempt == 0:
                print(f"[GEMINI] Network/Embedding error for chunk {chunk_index}: {e}. Retrying in 2 seconds...")
                time.sleep(2)
            else:
                print(f"[GEMINI ERROR] Final embedding failure for chunk {chunk_index}: {e}. Skipping chunk.")
                return None


def generate_answer(query: str, context: str) -> dict:
    if not context.strip():
        context_instruction = "No relevant chunks found. Analyze the query generally based on common legal knowledge."
    else:
        context_instruction = f"Use the following document excerpts as context:\n\n{context}"

    prompt = f"""You are an expert legal document analyst.

{context_instruction}

User query: {query}

Return ONLY raw JSON with no markdown formatting, no code fences, no explanation before or after. The JSON must have exactly these keys:
- "summary": A 2-3 sentence summary of the document or query.
- "risks": An array of risk strings identified in the document.
- "explanation": A plain English explanation of the document for a non-lawyer.
"""

    # Enforce strict JSON response MIME type
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.2
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config
        )
        raw = response.text.strip()
        parsed = json.loads(raw)
        if "summary" in parsed and "risks" in parsed and "explanation" in parsed:
            return parsed
    except Exception as e:
        print(f"[GEMINI] First parse attempt failed: {e}")

    retry_prompt = f"""You previously failed to return valid JSON. Try again.

{context_instruction}

User query: {query}

Return ONLY a valid JSON object with exactly these keys: "summary", "risks", "explanation".
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=retry_prompt,
            config=config
        )
        raw = response.text.strip()
        parsed = json.loads(raw)
        if "summary" in parsed and "risks" in parsed and "explanation" in parsed:
            return parsed
    except Exception as e:
        print(f"[GEMINI] Retry parse also failed: {e}")

    print("[GEMINI] Returning fallback response.")
    return FALLBACK_RESPONSE


def extract_text_from_image(file_bytes: bytes, mime_type: str) -> str:
    print(f"[GEMINI] Extracting text from image ({mime_type})")
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    "Extract all text from this image exactly as written. Do not add any extra commentary or formatting. If there is no text, just return an empty string.",
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
                ]
            )
            return response.text.strip()
        except Exception as e:
            print(f"[GEMINI ERROR] Attempt {attempt + 1}/{max_retries} - Image extraction failed: {e}")
            if attempt < max_retries - 1:
                # Exponential backoff: sleep for 2 seconds, then 4 seconds...
                time.sleep(2 ** (attempt + 1)) 
            else:
                from fastapi import HTTPException
                raise HTTPException(status_code=500, detail="Failed to extract text from image due to high AI demand. Please try again in a few minutes.")
