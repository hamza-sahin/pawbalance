-- supabase/migrations/002_video_chunks.sql
-- Stores embedded transcript chunks from YouTube videos for RAG retrieval

create extension if not exists vector;

create table video_chunks (
  id bigserial primary key,
  video_id text not null,
  video_title text not null,
  chunk_index integer not null,
  content text not null,
  token_count integer not null,
  timestamp_start integer,
  timestamp_end integer,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

create index idx_video_chunks_embedding
  on video_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index idx_video_chunks_video_id
  on video_chunks (video_id);

create or replace function search_video_chunks(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  video_title text,
  similarity float
)
as $$
  select
    vc.id,
    vc.content,
    vc.video_title,
    1 - (vc.embedding <=> query_embedding) as similarity
  from video_chunks vc
  order by vc.embedding <=> query_embedding
  limit match_count;
$$ language sql;
