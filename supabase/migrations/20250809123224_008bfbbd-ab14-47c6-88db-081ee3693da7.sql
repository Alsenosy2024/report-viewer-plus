-- Phase 2: Fix remaining function search_path security issues

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update match_testrag function with proper search_path  
CREATE OR REPLACE FUNCTION public.match_testrag(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - ("testRAG".embedding <=> query_embedding) as similarity
  FROM "testRAG"
  WHERE metadata @> filter
  ORDER BY "testRAG".embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Update match_documents function with proper search_path
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Update the overloaded match_testrag function with proper search_path
CREATE OR REPLACE FUNCTION public.match_testrag(filter jsonb, match_count integer, query_embedding vector)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.metadata,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM testRAG t
  WHERE (filter IS NULL OR t.metadata @> filter)
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;