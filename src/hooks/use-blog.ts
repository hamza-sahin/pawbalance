"use client";

import { useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { BlogPost } from "@/lib/types";

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, title_tr, title_en, excerpt_tr, excerpt_en, featured_image_url, tags, published_at, reading_time_min, slug, is_featured, source_url, created_at"
        )
        .order("published_at", { ascending: false });
      if (error) throw error;
      setPosts((data as BlogPost[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch blog posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { posts, isLoading, fetchPosts };
}

export function useBlogPost() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPost = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      setPost(data as BlogPost);
    } catch (err) {
      console.error("Failed to fetch blog post:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { post, isLoading, fetchPost };
}
