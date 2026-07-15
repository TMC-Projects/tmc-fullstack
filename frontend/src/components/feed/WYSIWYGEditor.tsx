'use client';

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Heading2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';

interface WYSIWYGEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  isSubmitting?: boolean;
}

export default function WYSIWYGEditor({ content, onChange, placeholder = 'Write something...', isSubmitting = false }: WYSIWYGEditorProps) {
  const { token } = useAuthStore();
  const showAlert = useAlertStore((state) => state.showAlert);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3',
        placeholder: placeholder,
      },
    },
    editable: !isSubmitting,
  });

  // Update content if reset from outside
  React.useEffect(() => {
    if (editor && content === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('');
    }
  }, [content, editor]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/posts/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        editor?.chain().focus().setImage({ src: data.data.url }).run();
      } else {
        showAlert(data.message || 'Failed to upload image', 'error');
      }
    } catch (error) {
      showAlert('Error uploading image', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-colors focus-within:border-violet-500 dark:focus-within:border-violet-500">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/50 flex-wrap">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          disabled={!editor.can().chain().focus().toggleBold().run() || isSubmitting}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          disabled={!editor.can().chain().focus().toggleItalic().run() || isSubmitting}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run() || isSubmitting}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}
          type="button"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          disabled={!editor.can().chain().focus().toggleBulletList().run() || isSubmitting}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          disabled={!editor.can().chain().focus().toggleOrderedList().run() || isSubmitting}
          className={`p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
        <button
          onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
          disabled={isUploading || isSubmitting}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          title="Upload Image"
          type="button"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/jpeg,image/png,image/webp" 
          className="hidden" 
        />
      </div>

      {/* Editor Content */}
      <div className="editor-container max-h-[400px] overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
