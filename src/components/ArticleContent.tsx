// src/components/ArticleContent.tsx
'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { CustomHighlight } from './editor/extensions/CustomHighlight';
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

interface ArticleContentProps {
  articleId: number;
  content: string;
  enableHighlights?: boolean;
}

interface Highlight {
  id: number;
  text: string;
  domId: string;
  userId: number;
}

const saveHighlight = async ({ articleId, text, domId }: { articleId: number; text: string; domId: string }) => {
    const response = await fetch(`/api/articles/${articleId}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, domId }),
    });
    if (!response.ok) {
        if (response.status === 401) throw new Error('UNAUTHORIZED');
        throw new Error('Failed to save highlight');
    }
    return response.json();
};

const fetchHighlights = async (articleId: number): Promise<Highlight[]> => {
    const response = await fetch(`/api/articles/${articleId}/highlights`);
    if (!response.ok) {
        throw new Error('Failed to fetch highlights');
    }
    return response.json();
};

export const ArticleContent = ({ articleId, content, enableHighlights = true }: ArticleContentProps) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [StarterKit, Image, Link, CustomHighlight],
    content: content,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none text-journal-light",
        style: "line-height: 1.8; font-size: 1.1rem;",
      },
    },
    immediatelyRender: false,
  });

  const { data: savedHighlights } = useQuery<Highlight[]>({
    queryKey: ['highlights', articleId],
    queryFn: () => fetchHighlights(articleId),
    enabled: enableHighlights && !!editor,
  });

  useEffect(() => {
    if (enableHighlights && editor && savedHighlights && savedHighlights.length > 0) {
      const { tr } = editor.state;
      let highlightsApplied = false;

      savedHighlights.forEach(highlight => {
        editor.state.doc.descendants((node, pos) => {
          // *** اصلاح اصلی برای رفع خطای تایپ‌اسکریپت ***
          if (node.isText && node.text) {
            const index = node.text.indexOf(highlight.text);
            if (index !== -1) {
              const from = pos + index;
              const to = from + highlight.text.length;
              tr.addMark(from, to, editor.schema.marks.highlight.create({ 'data-highlight-id': highlight.domId }));
              highlightsApplied = true;
              return false; // برای بهینه‌سازی: جستجو برای این هایلایت را متوقف کن
            }
          }
        });
      });

      if (highlightsApplied) {
        editor.view.dispatch(tr);
      }
    }
  }, [editor, savedHighlights]);

  const highlightMutation = useMutation({
    mutationFn: saveHighlight,
    onSuccess: () => {
        toast({ title: "موفق", description: "هایلایت شما ذخیره شد." });
    },
    onError: (error) => {
        if (error.message === 'UNAUTHORIZED') {
            toast({
                title: "خطا",
                description: "برای هایلایت کردن باید ابتدا وارد حساب کاربری خود شوید.",
                variant: "destructive",
                action: <Button onClick={() => router.push('/login')}>ورود</Button>
            });
        } else {
            toast({
                title: "خطا",
                description: "خطایی در ذخیره هایلایت رخ داد.",
                variant: "destructive",
            });
        }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleHighlight = () => {
    if (!enableHighlights) {
      return;
    }
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    editor.chain().focus().toggleHighlight().run();
    
    const highlightAttrs = editor.getAttributes('highlight');
    const domId = highlightAttrs['data-highlight-id'];
    
    if (selectedText && domId) {
        highlightMutation.mutate({ articleId, text: selectedText, domId });
    }
  };

  return (
    <>
      {enableHighlights && editor && (
          <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100 }}
            shouldShow={({ state }) => {
              const { from, to } = state.selection;
              return from !== to;
            }}
          >
            <div className="p-1 rounded-md bg-background shadow-lg border">
                <Button 
                    onClick={handleHighlight} 
                    size="sm" 
                    className="bg-yellow-300 text-yellow-900 hover:bg-yellow-400"
                    disabled={highlightMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  هایلایت
                </Button>
            </div>
          </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </>
  );
};
