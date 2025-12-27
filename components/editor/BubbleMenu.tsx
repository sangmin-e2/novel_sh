'use client';

import { EditorBubble, EditorBubbleItem, useEditor } from 'novel';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

export default function BubbleMenu() {
    const { editor } = useEditor();

    if (!editor) {
        return null;
    }

    return (
        <EditorBubble
            tippyOptions={{
                placement: 'top',
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
                <Bold size={16} />
            </EditorBubbleItem>
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
                <Italic size={16} />
            </EditorBubbleItem>
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
                <Underline size={16} />
            </EditorBubbleItem>
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
                <Strikethrough size={16} />
            </EditorBubbleItem>
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleCode().run()}
                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
                <Code size={16} />
            </EditorBubbleItem>
        </EditorBubble>
    );
}
