// src/components/editor/Tiptap.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Toolbar } from './Toolbar';

interface TiptapProps {
    content: string;
    onChange: (richText: string) => void;
}

const Tiptap = ({ content, onChange }: TiptapProps) => {
    const editor = useEditor({
        extensions: [StarterKit.configure({})],
        content: content,
        // --- FIX START ---
        // This prevents the editor from rendering on the server and causing a hydration mismatch.
        immediatelyRender: false,
        // --- FIX END ---
        editorProps: {
            attributes: {
                class: 'rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[400px] border prose dark:prose-invert max-w-none',
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="flex flex-col justify-stretch gap-2">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default Tiptap;