'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import { Loader2, RefreshCw, X } from 'lucide-react';
import Head from 'next/head';

export default function FeedPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const showAlert = useAlertStore((state) => state.showAlert);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
      return;
    }
    fetchData();
  }, [token, _hasHydrated, router]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch profile for the CreatePost component
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.success) {
        setUserProfile(profileData.data);
      }

      // Fetch Feed
      await fetchFeed();
    } catch (err: any) {
      setError(err.message || 'Failed to load feed data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch feed');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleCreatePost = async (content: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('Post created successfully!', 'success');
        setIsCreateModalOpen(false); // Close modal on success
        fetchFeed(); // Refresh the feed
      } else {
        showAlert(data.message || 'Failed to create post', 'error');
      }
    } catch (error) {
      showAlert('Error creating post', 'error');
    }
  };

  const handleLikeToggle = (postId: number, isLiked: boolean) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.ID === postId) {
          return {
            ...post,
            IsLiked: isLiked,
            LikeCount: isLiked ? post.LikeCount + 1 : Math.max(0, post.LikeCount - 1)
          };
        }
        return post;
      })
    );
  };

  const handleDeletePost = (postId: number) => {
    setPosts(prev => prev.filter(p => p.ID !== postId));
  };

  if (isLoading && !posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error && !posts.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-rose-400 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Feed | NJARA Platform</title>
      </Head>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        
        <div className="max-w-3xl mx-auto px-4 md:px-8 mt-8">
          {/* Create Post Trigger */}
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm mb-8 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
              {userProfile?.ProfilePictureUrl ? (
                <img src={userProfile.ProfilePictureUrl} alt={userProfile.FullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {userProfile?.FullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-5 py-3 text-sm">
              What's on your mind? Share your achievements or thoughts...
            </div>
          </div>

          {/* Create Post Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
              <div 
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold px-2">Create Post</h2>
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-2">
                  <CreatePost onSubmit={handleCreatePost} user={userProfile} />
                </div>
              </div>
            </div>
          )}

          {/* Feed List */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.ID} 
                  post={post} 
                  onLikeToggle={handleLikeToggle}
                  onDeletePost={handleDeletePost}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No posts yet</h3>
                <p className="text-slate-500">Be the first one to share something with the community!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
