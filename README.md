# AI Legal Document Analyzer

Upload a legal PDF or DOCX document and receive an instant AI-powered analysis:
a concise summary, identified risks, and a plain English explanation — powered by
Gemini 1.5 Flash with RAG (Retrieval-Augmented Generation) over Supabase pgvector.

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Supabase account** (free tier works) — [supabase.com](https://supabase.com)
- **Gemini API key** — [aistudio.google.com](https://aistudio.google.com/apikey)
- **Render account** (for deployment) — [render.com](https://render.com)

---

## 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase_setup.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid,
    content text,
    embedding vector(768)
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_count int,
    doc_id uuid
)
RETURNS TABLE(id uuid, content text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        documents.id,
        documents.content,
        1 - (documents.embedding <=> query_embedding) AS similarity
    FROM documents
    WHERE documents.document_id = doc_id
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

3. Copy your **Project URL** and **Service Role Key** from Settings → API.

---

## 2. Local Development Setup

### Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env` at the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
VITE_API_URL=http://localhost:8000
ORIGIN=http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Verify: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 3. Render Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/legal-ai-analyzer.git
git push -u origin main
```

### Step 2: Deploy Backend (Render Web Service)

| Setting        | Value                                      |
| -------------- | ------------------------------------------ |
| Runtime        | Python 3                                   |
| Root Directory | `backend`                                  |
| Build Command  | `pip install -r requirements.txt`          |
| Start Command  | `uvicorn main:app --host 0.0.0.0 --port 10000` |
| Health Check   | `/health`                                  |

**Environment Variables:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
ORIGIN=https://your-frontend.onrender.com
```

### Step 3: Deploy Frontend (Render Static Site)

| Setting          | Value                         |
| ---------------- | ----------------------------- |
| Root Directory   | `frontend`                    |
| Build Command    | `npm install && npm run build`|
| Publish Directory| `dist`                        |

**Environment Variables:**

```
VITE_API_URL=https://your-backend.onrender.com
```

### Step 4: Wire CORS

1. Copy your deployed **frontend URL** (e.g., `https://legal-ai-frontend.onrender.com`)
2. Set it as `ORIGIN` in your **backend** Render environment variables
3. Redeploy the backend

---

## Architecture

```
User → React Frontend → FastAPI Backend → Gemini 1.5 Flash
                                      ↕
                              Supabase pgvector
```

**Upload Flow:** File → Extract text → Clean → Chunk → Embed (text-embedding-004) → Store in pgvector

**Analyze Flow:** Query → Embed → Vector similarity search (filtered by document_id) → Top-K context → Gemini generates structured JSON

---

## API Endpoints

| Method | Endpoint   | Description                        |
| ------ | ---------- | ---------------------------------- |
| GET    | `/health`  | Health check                       |
| POST   | `/upload`  | Upload PDF/DOCX, returns document_id |
| POST   | `/analyze` | Analyze document by document_id    |

---

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Frontend   | React 18 + Vite 5             |
| Backend    | FastAPI (async)               |
| LLM        | Gemini 1.5 Flash              |
| Embeddings | text-embedding-004 (768 dim)  |
| Vector DB  | Supabase PostgreSQL + pgvector|
| Parsing    | pdfplumber, python-docx       |

---

## License

MIT
