import { useState } from 'react';
import { X, Send, Heart, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onToggleCommentLike: (commentId: string) => void;
  onToggleCommentDislike: (commentId: string) => void;
}

export function CommentsModal({
  isOpen,
  onClose,
  post,
  comments,
  onAddComment,
  onToggleCommentLike,
  onToggleCommentDislike
}: CommentsModalProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    onAddComment(commentText);
    setCommentText('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-slate-800 rounded-t-3xl sm:rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-3xl">
            <div>
              <h2 className="text-xl font-bold text-white">Comments</h2>
              <p className="text-sm text-slate-400">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium mb-2">No comments yet</p>
                <p className="text-slate-500 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
                >
                  {/* Comment Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm truncate">
                          {comment.user.name}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 text-xs">{comment.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-xs">{comment.user.username}</p>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-slate-200 text-sm leading-relaxed mb-3">
                    {comment.content}
                  </p>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onToggleCommentLike(comment.id)}
                      className={`flex items-center gap-2 transition-colors group ${
                        user && comment.likedBy.includes(user.email)
                          ? 'text-red-400'
                          : 'text-slate-400 hover:text-red-400'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                          user && comment.likedBy.includes(user.email) ? 'fill-current' : ''
                        }`}
                      />
                      <span className="text-xs font-semibold">{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => onToggleCommentDislike(comment.id)}
                      className={`flex items-center gap-2 transition-colors group ${
                        user && comment.dislikedBy.includes(user.email)
                          ? 'text-blue-400'
                          : 'text-slate-400 hover:text-blue-400'
                      }`}
                    >
                      <ThumbsDown
                        className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                          user && comment.dislikedBy.includes(user.email) ? 'fill-current' : ''
                        }`}
                      />
                      <span className="text-xs font-semibold">{comment.dislikes}</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-slate-700 p-4 bg-slate-800 rounded-b-3xl">
            <div className="flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2C3863] focus:border-transparent"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-6 py-3 bg-[#2C3863] hover:bg-[#3d4a7d] disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
