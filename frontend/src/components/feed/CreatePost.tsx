'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import WYSIWYGEditor from './WYSIWYGEditor';
import { Send, Loader2 } from 'lucide-react';

interface CreatePostProps {
  onSubmit: (content: string) => Promise<void>;
  user: any;
}

export default function CreatePost({ onSubmit, user }: CreatePostProps) {
  const t = useTranslations('Feed');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || content === '<p></p>') return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <form onSubmit={handleSubmit}>
        <WYSIWYGEditor
          content={content}
          onChange={setContent}
          placeholder={t('placeholder')}
          isSubmitting={isSubmitting}
        />
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={isSubmitting || !content || content === '<p></p>'}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t('post_btn')}
          </button>
        </div>
      </form>
    </div>
  );
}
