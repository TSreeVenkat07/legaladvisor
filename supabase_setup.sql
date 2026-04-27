-- ============================================
-- AI Legal Document Analyzer — Supabase Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid,
    content text,
    embedding vector(768)
);

-- 3. Create IVFFlat index for fast cosine similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- 4. Create similarity search function
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
