import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Post {
  id: string;
  user_id: string;
  ticker: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  username: string;
  liked: boolean;
}

interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  refresh: () => Promise<void>;
  createPost: (ticker: string | null, content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch posts + joined username
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, ticker, content, likes_count, created_at, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (postsError) throw postsError;

      // Fetch which posts the current user has liked
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedSet = new Set((likesData ?? []).map((l: { post_id: string }) => l.post_id));

      const mapped: Post[] = (postsData ?? []).map((p: {
        id: string;
        user_id: string;
        ticker: string | null;
        content: string;
        likes_count: number;
        created_at: string;
        profiles: { username: string } | null;
      }) => ({
        id: p.id,
        user_id: p.user_id,
        ticker: p.ticker,
        content: p.content,
        likes_count: p.likes_count,
        created_at: p.created_at,
        username: p.profiles?.username ?? 'Anonymous',
        liked: likedSet.has(p.id),
      }));

      setPosts(mapped);
    } catch (err) {
      console.error('PostsContext fetchPosts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(async (ticker: string | null, content: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, ticker: ticker || null, content });
    if (error) throw error;
    await fetchPosts();
  }, [user, fetchPosts]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: true, likes_count: p.likes_count + 1 } : p
    ));
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });
    if (error) {
      // Rollback
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked: false, likes_count: p.likes_count - 1 } : p
      ));
    }
  }, [user]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return;
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: false, likes_count: Math.max(0, p.likes_count - 1) } : p
    ));
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    if (error) {
      // Rollback
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked: true, likes_count: p.likes_count + 1 } : p
      ));
    }
  }, [user]);

  return (
    <PostsContext.Provider value={{ posts, loading, refresh: fetchPosts, createPost, likePost, unlikePost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used inside PostsProvider');
  return ctx;
}
