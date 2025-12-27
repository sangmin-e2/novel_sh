'use client';

import { Command, createSuggestionItems, renderItems } from 'novel';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import YouTube from '@tiptap/extension-youtube';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
    CheckSquare, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Text, TextQuote, Image as ImageIcon, Youtube,
} from 'lucide-react';
import type { JSONContent } from '@tiptap/core';

// 슬래시 명령어 아이템 생성 함수 (업로드 함수 포함)
export const createSuggestionItemsWithUpload = (
    uploadFn?: (file: File) => Promise<string>,
    onEditorReady?: (editor: any) => void
) => {
    return createSuggestionItems([
        {
            title: 'Text',
            description: '일반 텍스트로 시작합니다.',
            searchTerms: ['p', 'paragraph', '텍스트'],
            icon: <Text size={18} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
            },
        },
        {
            title: 'Heading 1',
            description: '큰 섹션 제목.',
            searchTerms: ['title', 'big', 'h1', '제목1'],
            icon: <Heading1 size={18} />,
            command: ({ editor, range }) => {
                if (editor && range) {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
                }
            },
        },
        {
            title: 'Heading 2',
            description: '중간 섹션 제목.',
            searchTerms: ['subtitle', 'medium', 'h2', '제목2'],
            icon: <Heading2 size={18} />,
            command: ({ editor, range }) => {
                if (editor && range) {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
                }
            },
        },
        {
            title: 'Heading 3',
            description: '작은 섹션 제목.',
            searchTerms: ['subtitle', 'small', 'h3', '제목3'],
            icon: <Heading3 size={18} />,
            command: ({ editor, range }) => {
                if (editor && range) {
                    editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
                }
            },
        },
        {
            title: 'Bullet List',
            description: '순서 없는 목록을 만듭니다.',
            searchTerms: ['unordered', 'point', '목록'],
            icon: <List size={18} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Numbered List',
            description: '순서 있는 목록을 만듭니다.',
            searchTerms: ['ordered', '번호'],
            icon: <ListOrdered size={18} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: 'To-do List',
            description: '할 일 목록을 만듭니다.',
            searchTerms: ['todo', 'task', 'list', 'check', 'checkbox', '할일'],
            icon: <CheckSquare size={18} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: 'Quote',
            description: '인용구를 삽입합니다.',
            searchTerms: ['blockquote', '인용'],
            icon: <TextQuote size={18} />,
            command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run(),
        },
        {
            title: 'Code',
            description: '코드 블록을 삽입합니다.',
            searchTerms: ['codeblock', '코드'],
            icon: <Code size={18} />,
            command: ({ editor, range }) =>
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
        },
        {
            title: 'Image',
            description: '이미지를 업로드합니다.',
            searchTerms: ['image', 'img', 'picture', 'photo', '이미지'],
            icon: <ImageIcon size={18} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                if (onEditorReady) {
                    onEditorReady(editor);
                }
                // 이미지 업로드 처리
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && uploadFn) {
                        // 파일 크기 검증 (50MB)
                        const maxSize = 50 * 1024 * 1024;
                        if (file.size > maxSize) {
                            alert(`이미지 크기는 50MB 이하여야 합니다. 현재 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                            return;
                        }

                        try {
                            const url = await uploadFn(file);
                            // ProseMirror 노드로 직접 삽입
                            editor.chain().focus().insertContent({
                                type: 'image',
                                attrs: {
                                    src: url,
                                },
                            }).run();
                        } catch (error: any) {
                            console.error('Image upload error:', error);
                            alert(error.message || '이미지 업로드에 실패했습니다.');
                        }
                    }
                };
                input.click();
            },
        },
        {
            title: 'YouTube',
            description: '유튜브 동영상을 삽입합니다.',
            searchTerms: ['youtube', 'video', 'embed', '유튜브', '동영상'],
            icon: <Youtube size={18} />,
            command: ({ editor, range }) => {
                const url = prompt('YouTube URL을 입력하세요:');
                if (!url) return;

                // YouTube URL에서 비디오 ID 추출
                const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                const match = url.match(youtubeRegex);

                if (match) {
                    const videoId = match[1];
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent({
                            type: 'youtube',
                            attrs: {
                                src: `https://www.youtube.com/embed/${videoId}`,
                            },
                        })
                        .run();
                } else {
                    alert('유효한 YouTube URL이 아닙니다.\n예: https://www.youtube.com/watch?v=VIDEO_ID 또는 https://youtu.be/VIDEO_ID');
                }
            },
        },
    ]);
};

// 기본 suggestionItems (업로드 함수 없이)
export const suggestionItems = createSuggestionItemsWithUpload();

// 슬래시 명령어 확장 설정
export const createSlashCommand = (items: typeof suggestionItems) => {
    return Command.configure({
        suggestion: {
            items: () => items,
            render: renderItems, // ← 필수! 이게 없으면 메뉴 자체가 안 나옴
        },
    });
};

// 기본 slashCommand
export const slashCommand = createSlashCommand(suggestionItems);

// Tiptap 확장 설정
export const extensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
        link: false, // Link 확장 비활성화 (중복 방지)
    }),
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
            class: 'rounded-lg',
        },
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-cyan-400 hover:text-cyan-300 underline',
        },
    }),
    YouTube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
            class: 'rounded-lg',
        },
    }),
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    slashCommand,
];
