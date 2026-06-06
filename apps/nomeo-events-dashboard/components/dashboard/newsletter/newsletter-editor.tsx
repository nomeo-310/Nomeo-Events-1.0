// newsletter-editor.tsx
import React, { useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Blockquote } from '@tiptap/extension-blockquote';
import { HardBreak } from '@tiptap/extension-hard-break';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UndoIcon,
  RedoIcon,
  TextBoldIcon as Bold01Icon,
  TextItalicIcon as Italic01Icon,
  TextUnderlineIcon as Underline01Icon,
  TextAlignLeftIcon as AlignLeft01Icon,
  TextAlignCenterIcon as AlignCenter01Icon,
  TextAlignRightIcon as AlignRight01Icon,
  LeftToRightListNumberIcon as ListOrderedIcon,
  LeftToRightListDashIcon as ListUnorderedIcon,
  Link02Icon,
  Image01Icon,
  CodeIcon,
  QuoteDownIcon as QuoteIcon,
  EraserIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { ImageUrlModal } from "./newsletter-modals";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageGalleryOpen?: () => void;
}

export function RichTextEditor({ content, onChange, placeholder, onImageGalleryOpen }: RichTextEditorProps) {
  const [isImageUrlModalOpen, setIsImageUrlModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlock,
      Blockquote,
      HardBreak,
      HorizontalRule,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your email content here...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none min-h-[300px] p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white [&_.is-editor-empty]:text-gray-400 [&_.is-editor-empty]:dark:text-gray-600',
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      toast.loading('Uploading image...');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/api/admin/newsletter/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success && editor) {
          editor.chain().focus().setImage({ 
            src: response.data.image.url,
            alt: response.data.image.alt 
          }).run();
          toast.dismiss();
          toast.success('Image uploaded successfully');
        } else {
          toast.dismiss();
          toast.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.dismiss();
        toast.error('Failed to upload image');
      }
    };
    input.click();
  };

  if (!editor) {
    return <div className="h-[300px] border rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 p-2 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          {/* Undo/Redo */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="text-sm">
            <HugeiconsIcon icon={UndoIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="text-sm">
            <HugeiconsIcon icon={RedoIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Text Formatting */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Bold01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Italic01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Underline01Icon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Headings */}
          <Select onValueChange={(value) => {
            if (value === 'paragraph') editor.chain().focus().setParagraph().run();
            else if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
          }} value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'paragraph'
          }>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Lists */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={ListUnorderedIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={ListOrderedIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Alignment */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignLeft01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignCenter01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignRight01Icon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Blocks */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={QuoteIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={CodeIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Links & Images */}
          <Button type="button" size="sm" variant="ghost" onClick={() => {
            const url = prompt('Enter URL:');
            if (url && editor) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}>
            <HugeiconsIcon icon={Link02Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleImageUpload}>
            <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsImageUrlModalOpen(true)}>
            <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
            <span className="text-xs ml-1">URL</span>
          </Button>
          {onImageGalleryOpen && (
            <Button type="button" size="sm" variant="ghost" onClick={onImageGalleryOpen}>
              <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
              <span className="text-xs ml-1">Gallery</span>
            </Button>
          )}
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Clear Formatting */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <HugeiconsIcon icon={EraserIcon} className="h-4 w-4" />
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
      
      <ImageUrlModal
        isOpen={isImageUrlModalOpen}
        onClose={() => setIsImageUrlModalOpen(false)}
        onInsert={(url) => {
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      />
    </>
  );
}