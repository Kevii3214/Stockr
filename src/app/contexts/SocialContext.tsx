import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Stock } from '../data/mockStocks';
import { mockUserPosts, UserPost } from '../data/mockUserPosts';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { supabase } from '../../lib/supabase';

export interface Comment {
  id: string;
  postId: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

export interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followers: number;
  following: number;
  portfolioPublic: boolean;
}

export interface Post extends UserPost {
  likedBy: string[];
  dislikedBy: string[];
}

interface SocialContextType {
  posts: Post[];
  comments: Comment[];
  suggestedUsers: SocialUser[];
  followedUsers: string[];
  portfolioPublic: boolean;
  createPost: (stock: Stock, caption: string, sentiment: 'bullish' | 'bearish' | 'neutral') => void;
  toggleLike: (postId: string) => void;
  toggleDislike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  toggleCommentLike: (commentId: string) => void;
  toggleCommentDislike: (commentId: string) => void;
  getPostComments: (postId: string) => Comment[];
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  setPortfolioPublic: (isPublic: boolean) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SocialUser[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [portfolioPublic, setPortfolioPublic] = useState<boolean>(true);

  // Initialize suggested users
  useEffect(() => {
    const mockSuggestedUsers: SocialUser[] = [
      {
        id: 'user-1',
        name: 'Warren Insights',
        username: '@warreninsights',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
        verified: true,
        bio: 'Value investor 📊 | 20+ years experience | Sharing market insights',
        followers: 125000,
        following: 342,
        portfolioPublic: true
      },
      {
        id: 'user-2',
        name: 'TechStockGuru',
        username: '@techstockguru',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
        verified: true,
        bio: 'Tech analyst 💻 | FAANG specialist | Daily market updates',
        followers: 89000,
        following: 156,
        portfolioPublic: true
      },
      {
        id: 'user-3',
        name: 'CryptoQueen',
        username: '@cryptoqueen',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
        verified: true,
        bio: 'Crypto enthusiast 🚀 | Bitcoin maximalist | Web3 investor',
        followers: 67000,
        following: 89,
        portfolioPublic: false
      },
      {
        id: 'user-4',
        name: 'DividendKing',
        username: '@dividendking',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
        verified: true,
        bio: 'Passive income strategist 💰 | Dividend portfolio builder',
        followers: 54000,
        following: 234,
        portfolioPublic: true
      },
      {
        id: 'user-5',
        name: 'Emily Markets',
        username: '@emilymarkets',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
        verified: false,
        bio: 'Day trader | Swing positions | Technical analysis',
        followers: 12500,
        following: 678,
        portfolioPublic: true
      },
      {
        id: 'user-6',
        name: 'GrowthHacker',
        username: '@growthhacker',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
        verified: false,
        bio: 'Growth stock investor 📈 | Finding the next 10x',
        followers: 8900,
        following: 432,
        portfolioPublic: false
      }
    ];
    setSuggestedUsers(mockSuggestedUsers);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const storedPosts = localStorage.getItem('stockr_posts');
    const storedComments = localStorage.getItem('stockr_comments');
    const storedFollowedUsers = localStorage.getItem('stockr_followed_users');
    const storedPortfolioPublic = localStorage.getItem('stockr_portfolio_public');
    
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    } else {
      // Initialize with mock posts, adding empty interaction arrays
      const initialPosts = mockUserPosts.map(post => ({
        ...post,
        likedBy: [],
        dislikedBy: []
      }));
      setPosts(initialPosts);
      localStorage.setItem('stockr_posts', JSON.stringify(initialPosts));
    }

    if (storedComments) {
      setComments(JSON.parse(storedComments));
    }

    if (storedFollowedUsers) {
      setFollowedUsers(JSON.parse(storedFollowedUsers));
    }

    if (storedPortfolioPublic !== null) {
      setPortfolioPublic(JSON.parse(storedPortfolioPublic));
    }
  }, []);

  // Save to localStorage whenever posts or comments change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('stockr_posts', JSON.stringify(posts));
    }
  }, [posts]);

  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem('stockr_comments', JSON.stringify(comments));
    }
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('stockr_followed_users', JSON.stringify(followedUsers));
  }, [followedUsers]);

  useEffect(() => {
    localStorage.setItem('stockr_portfolio_public', JSON.stringify(portfolioPublic));
  }, [portfolioPublic]);

  const createPost = (stock: Stock, caption: string, sentiment: 'bullish' | 'bearish' | 'neutral') => {
    if (!user) return;

    const newPost: Post = {
      id: `user-${Date.now()}`,
      user: {
        name: user.name,
        username: `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=400&h=400&fit=crop`,
        verified: false,
      },
      stock,
      caption,
      sentiment,
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
      likedBy: [],
      dislikedBy: []
    };

    setPosts(prev => [newPost, ...prev]);
    addXP(50, '📝 Created a post!'); // Award XP for posting

    // Persist to Supabase (fire and forget)
    supabase.from('posts').insert({
      user_id: user.id,
      ticker: stock.symbol,
      content: caption,
    }).then(({ error }) => {
      if (error) console.warn('Failed to persist post to Supabase:', error.message);
    });
  };

  const toggleLike = (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedBy.includes(user.email);
        const isDisliked = post.dislikedBy.includes(user.email);
        
        let newLikedBy = [...post.likedBy];
        let newDislikedBy = [...post.dislikedBy];
        let newLikes = post.likes;

        if (isLiked) {
          // Remove like
          newLikedBy = newLikedBy.filter(email => email !== user.email);
          newLikes--;
        } else {
          // Add like
          newLikedBy.push(user.email);
          newLikes++;
          // Remove dislike if exists
          if (isDisliked) {
            newDislikedBy = newDislikedBy.filter(email => email !== user.email);
          }
          addXP(5, '👍 Liked a post!');
        }

        return {
          ...post,
          likes: newLikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy
        };
      }
      return post;
    }));
  };

  const toggleDislike = (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedBy.includes(user.email);
        const isDisliked = post.dislikedBy.includes(user.email);
        
        let newLikedBy = [...post.likedBy];
        let newDislikedBy = [...post.dislikedBy];
        let newLikes = post.likes;

        if (isDisliked) {
          // Remove dislike
          newDislikedBy = newDislikedBy.filter(email => email !== user.email);
        } else {
          // Add dislike
          newDislikedBy.push(user.email);
          // Remove like if exists
          if (isLiked) {
            newLikedBy = newLikedBy.filter(email => email !== user.email);
            newLikes--;
          }
        }

        return {
          ...post,
          likes: newLikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy
        };
      }
      return post;
    }));
  };

  const addComment = (postId: string, content: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      user: {
        name: user.name,
        username: `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=400&h=400&fit=crop`,
      },
      content,
      timestamp: 'Just now',
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: []
    };

    setComments(prev => [...prev, newComment]);
    
    // Update post comment count
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));

    addXP(20, '💬 Commented on a post!');
  };

  const toggleCommentLike = (commentId: string) => {
    if (!user) return;

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes(user.email);
        const isDisliked = comment.dislikedBy.includes(user.email);
        
        let newLikedBy = [...comment.likedBy];
        let newDislikedBy = [...comment.dislikedBy];
        let newLikes = comment.likes;

        if (isLiked) {
          newLikedBy = newLikedBy.filter(email => email !== user.email);
          newLikes--;
        } else {
          newLikedBy.push(user.email);
          newLikes++;
          if (isDisliked) {
            newDislikedBy = newDislikedBy.filter(email => email !== user.email);
            comment.dislikes--;
          }
        }

        return {
          ...comment,
          likes: newLikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy
        };
      }
      return comment;
    }));
  };

  const toggleCommentDislike = (commentId: string) => {
    if (!user) return;

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.likedBy.includes(user.email);
        const isDisliked = comment.dislikedBy.includes(user.email);
        
        let newLikedBy = [...comment.likedBy];
        let newDislikedBy = [...comment.dislikedBy];
        let newDislikes = comment.dislikes;

        if (isDisliked) {
          newDislikedBy = newDislikedBy.filter(email => email !== user.email);
          newDislikes--;
        } else {
          newDislikedBy.push(user.email);
          newDislikes++;
          if (isLiked) {
            newLikedBy = newLikedBy.filter(email => email !== user.email);
            comment.likes--;
          }
        }

        return {
          ...comment,
          dislikes: newDislikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy
        };
      }
      return comment;
    }));
  };

  const getPostComments = (postId: string): Comment[] => {
    return comments.filter(comment => comment.postId === postId);
  };

  const toggleFollow = (userId: string) => {
    if (!user) return;

    setFollowedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const isFollowing = (userId: string): boolean => {
    return followedUsers.includes(userId);
  };

  return (
    <SocialContext.Provider
      value={{
        posts,
        comments,
        suggestedUsers,
        followedUsers,
        portfolioPublic,
        createPost,
        toggleLike,
        toggleDislike,
        addComment,
        toggleCommentLike,
        toggleCommentDislike,
        getPostComments,
        toggleFollow,
        isFollowing,
        setPortfolioPublic
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}