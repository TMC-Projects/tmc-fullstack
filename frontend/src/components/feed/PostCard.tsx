'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const renderContentWithMentions = (content: string) => {
  if (!content) return null;
  const mentionRegex = /(@[\w.-]+)/g;
  const parts = content.split(mentionRegex);

  return parts.map((part, i) => {
    if (part.match(mentionRegex)) {
      const username = part.slice(1);
      return (
        <Link key={i} href={`/app/player/${username}`} className="text-violet-500 hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
};

interface Comment {
  ID: number;
  Content: string;
  CreatedAt: string;
  User: any;
}

interface PostCardProps {
  post: any;
  onLikeToggle: (postId: number, isLiked: boolean) => void;
  onDeletePost?: (postId: number) => void;
}

export default function PostCard({ post, onLikeToggle, onDeletePost }: PostCardProps) {
  const { token, user: currentUser } = useAuthStore();
  const showAlert = useAlertStore((state) => state.showAlert);
  const t = useTranslations('Feed');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [interactors, setInteractors] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/${post.ID}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchInteractors = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/${post.ID}/interactors`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInteractors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch interactors', error);
    }
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0 && post.CommentCount > 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/${post.ID}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLikeToggle(post.ID, data.data.is_liked);
      }
    } catch (error) {
      console.error('Failed to toggle like', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Valid mention query shouldn't have spaces
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionIndex(lastAtIndex);
        setShowSuggestions(true);
        if (interactors.length === 0) {
          fetchInteractors();
        }
        return;
      }
    }

    setShowSuggestions(false);
  };

  const insertMention = (mentionName: string) => {
    const textBeforeMention = newComment.substring(0, mentionIndex);
    const textAfterCursor = newComment.substring(mentionIndex + mentionQuery.length + 1);
    setNewComment(`${textBeforeMention}@${mentionName} ${textAfterCursor}`);
    setShowSuggestions(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/${post.ID}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewComment('');
        // Fetch comments again to get full user data for the new comment
        fetchComments();
      } else {
        showAlert(data.message || t('failed_post_comment'), 'error');
      }
    } catch (error) {
      showAlert(t('failed_post_comment'), 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm(t('delete_confirm'))) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/${post.ID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert(t('post_deleted'), 'success');
        if (onDeletePost) onDeletePost(post.ID);
      } else {
        showAlert(data.message || t('failed_delete_post'), 'error');
      }
    } catch (error) {
      console.error('Failed to delete post', error);
      showAlert(t('failed_delete_post'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const user = post.User;
  const isOwner = currentUser?.id === post.UserID;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6 ${showSuggestions ? 'relative z-50' : 'relative z-0'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
            {user?.ProfilePictureUrl ? (
              <img src={user.ProfilePictureUrl} alt={user.FullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                {user?.FullName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {user?.FullName || t('unknown_user')}
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {user?.Category || 'player'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.Club?.Name || t('free_agent')} • {formatDistanceToNow(new Date(post.CreatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title={t('delete_confirm')}
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
          )}
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm md:text-base mb-4"
        dangerouslySetInnerHTML={{ __html: post.Content }}
      />

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
        <span className="flex items-center gap-1">
          {post.LikeCount} {t('like')}
        </span>
        <span className="flex items-center gap-1 cursor-pointer hover:underline" onClick={handleToggleComments}>
          {post.CommentCount} {t('comment')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors font-medium ${
            post.IsLiked
              ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.IsLiked ? 'fill-current' : ''}`} />
          {t('like')}
        </button>
        <button
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          {t('comment')}
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">
          <Share2 className="w-5 h-5" />
          {t('share')}
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"
          >
            {/* Comment Input */}
            <div className="relative mb-6">
              <form onSubmit={handleSubmitComment} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={handleCommentChange}
                  placeholder={t('write_comment')}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-violet-500 hover:bg-violet-600 text-white rounded-full disabled:opacity-50 transition-colors"
                >
                  {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>

              {showSuggestions && interactors.length > 0 && (
                <div className="absolute left-0 bottom-full mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100]">
                  {interactors
                    .filter(u => u.FullName.toLowerCase().includes(mentionQuery.toLowerCase()) || (u.Username && u.Username.toLowerCase().includes(mentionQuery.toLowerCase())))
                    .map(u => (
                      <div
                        key={u.ID}
                        className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm"
                        onClick={() => insertMention(u.Username || u.FullName.replace(/\s+/g, ''))}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden flex items-center justify-center text-xs">
                          {u.ProfilePictureUrl ? (
                            <img src={u.ProfilePictureUrl} alt={u.FullName} className="w-full h-full object-cover" />
                          ) : (
                            u.FullName.charAt(0)
                          )}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{u.FullName}</span>
                        {u.Username && <span className="text-slate-500 text-xs">@{u.Username}</span>}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Comment List */}
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.ID} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
                      {comment.User?.ProfilePictureUrl ? (
                        <img src={comment.User.ProfilePictureUrl} alt={comment.User.FullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                          {comment.User?.FullName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{comment.User?.FullName}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">{renderContentWithMentions(comment.Content)}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-2">
                        {formatDistanceToNow(new Date(comment.CreatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
