-- =============================================
-- Food Safety Database
-- Migration: 004_create_foods_table
-- Date: 2026-01-09
-- =============================================

-- Enable pg_trgm extension for similarity search (fuzzy matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- =============================================
-- Foods Table
-- =============================================

-- Create foods table with bilingual support
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  name_tr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category_tr TEXT NOT NULL,
  category_en TEXT NOT NULL,
  safety_level TEXT NOT NULL CHECK (safety_level IN ('SAFE', 'MODERATE', 'TOXIC')),
  dangerous_parts_tr TEXT,
  dangerous_parts_en TEXT,
  preparation_tr TEXT,
  preparation_en TEXT,
  benefits_tr TEXT,
  benefits_en TEXT,
  warnings_tr TEXT,
  warnings_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create full-text search indexes for both languages
CREATE INDEX IF NOT EXISTS foods_name_tr_search_idx ON public.foods 
USING GIN (to_tsvector('simple', name_tr));
CREATE INDEX IF NOT EXISTS foods_name_en_search_idx ON public.foods 
USING GIN (to_tsvector('simple', name_en));
-- Create combined search index
CREATE INDEX IF NOT EXISTS foods_name_combined_search_idx ON public.foods 
USING GIN (to_tsvector('simple', name_tr || ' ' || name_en));
-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS foods_name_tr_trgm_idx ON public.foods 
USING GIN (name_tr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS foods_name_en_trgm_idx ON public.foods 
USING GIN (name_en gin_trgm_ops);
-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS foods_category_en_idx ON public.foods(category_en);
CREATE INDEX IF NOT EXISTS foods_category_tr_idx ON public.foods(category_tr);
-- Create index on safety_level for filtering
CREATE INDEX IF NOT EXISTS foods_safety_level_idx ON public.foods(safety_level);
-- =============================================
-- Foods RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
-- Everyone can read foods (public data)
CREATE POLICY "Foods are publicly readable"
ON public.foods FOR SELECT
TO authenticated
USING (true);
-- =============================================
-- Food Requests Table
-- =============================================

-- Create food_requests table for user submissions
CREATE TABLE IF NOT EXISTS public.food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS food_requests_user_id_idx ON public.food_requests(user_id);
-- Create index on status for admin filtering
CREATE INDEX IF NOT EXISTS food_requests_status_idx ON public.food_requests(status);
-- =============================================
-- Food Requests RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;
-- Users can create food requests
CREATE POLICY "Users can create food requests"
ON public.food_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.food_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
-- =============================================
-- Search Functions
-- =============================================

-- Create search function for bilingual matching
CREATE OR REPLACE FUNCTION search_foods(search_query TEXT)
RETURNS SETOF public.foods AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.foods
  WHERE 
    name_tr ILIKE '%' || search_query || '%'
    OR name_en ILIKE '%' || search_query || '%'
  ORDER BY
    -- Exact matches first
    CASE 
      WHEN LOWER(name_tr) = LOWER(search_query) OR LOWER(name_en) = LOWER(search_query) THEN 0
      WHEN LOWER(name_tr) LIKE LOWER(search_query) || '%' OR LOWER(name_en) LIKE LOWER(search_query) || '%' THEN 1
      ELSE 2
    END,
    name_en ASC;
END;
$$ LANGUAGE plpgsql STABLE;
-- Create function to get similar foods (for no results suggestions)
CREATE OR REPLACE FUNCTION get_similar_foods(search_query TEXT, limit_count INT DEFAULT 5)
RETURNS SETOF public.foods AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.foods
  WHERE 
    similarity(name_tr, search_query) > 0.2
    OR similarity(name_en, search_query) > 0.2
  ORDER BY 
    GREATEST(similarity(name_tr, search_query), similarity(name_en, search_query)) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
-- =============================================
-- Category View
-- =============================================

-- Create view for category counts
CREATE OR REPLACE VIEW public.food_categories AS
SELECT 
  category_en AS id,
  category_tr AS name_tr,
  category_en AS name_en,
  COUNT(*)::INT AS food_count
FROM public.foods
GROUP BY category_tr, category_en
ORDER BY category_en;
-- =============================================
-- Updated At Trigger
-- =============================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger on foods table
DROP TRIGGER IF EXISTS trigger_update_foods_updated_at ON public.foods;
CREATE TRIGGER trigger_update_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW
  EXECUTE FUNCTION update_foods_updated_at();
