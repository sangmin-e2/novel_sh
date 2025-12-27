'use client';

import { useMemo, useState } from 'react';
import {
    EditorRoot,
    EditorContent,
    EditorCommand,
    EditorCommandItem,
    EditorCommandEmpty,
    EditorCommandList,
    createImageUpload,
    handleImagePaste,
    handleImageDrop,
    UpdatedImage,
    UploadImagesPlugin,
} from 'novel';
import type { JSONContent } from '@tiptap/core';
import { createClient } from '@/lib/supabase/client';
import { extensions as baseExtensions, suggestionItems } from './extensions';
import { ImageResizeExtension } from './extensions/ImageResizeExtension';
import BubbleMenu from './BubbleMenu';

interface BlogEditorProps {
    content?: JSONContent;
    onChange?: (content: JSONContent) => void;
    uploadFn?: (file: File) => Promise<string>;
}

export default function BlogEditor({ content, onChange, uploadFn }: BlogEditorProps) {
    const supabase = createClient();
    const [isUploading, setIsUploading] = useState(false);

    // 이미지 업로드 함수 생성
    const imageUploadFn = useMemo(() => {
        return createImageUpload({
            validateFn: (file: File) => {
                // 파일 타입 검증
                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드할 수 있습니다.');
                    return false;
                }
                // 파일 크기 검증 (최대 50MB)
                if (file.size > 50 * 1024 * 1024) {
                    alert('파일 크기는 50MB를 초과할 수 없습니다.');
                    return false;
                }
                return true;
            },
            onUpload: async (file: File): Promise<string> => {
                setIsUploading(true);
                try {
                    // 사용자 제공 uploadFn가 있으면 사용
                    if (uploadFn) {
                        return await uploadFn(file);
                    }

                    // 기본 업로드 구현 (Supabase Storage)
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `blog-images/${fileName}`;

                    const { data, error } = await supabase.storage.from('blog-images').upload(filePath, file);

                    if (error) {
                        console.error('Image upload error:', error);
                        throw error;
                    }

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from('blog-images').getPublicUrl(filePath);

                    return publicUrl;
                } finally {
                    setIsUploading(false);
                }
            },
        });
    }, [uploadFn, supabase]);

    // UpdatedImage 확장 사용
    const imageExtension = useMemo(() => {
        return UpdatedImage.extend({
            addProseMirrorPlugins() {
                return [
                    UploadImagesPlugin({
                        imageClass: 'opacity-40 rounded-lg border border-slate-300',
                    }),
                ];
            },
        }).configure({
            allowBase64: false, // Base64 인코딩 비활성화 (URL만 사용)
            HTMLAttributes: {
                class: 'rounded-lg border border-slate-300',
                style: 'max-width: 100%; height: auto; max-height: 600px; object-fit: contain; cursor: pointer;',
            },
            inline: false, // 블록 레벨 이미지
        });
    }, []);

    const editorExtensions = useMemo(() => {
        return [...baseExtensions, imageExtension, ImageResizeExtension];
    }, [imageExtension]);

    return (
        <EditorRoot>
            <EditorContent
                initialContent={content}
                extensions={editorExtensions}
                onUpdate={({ editor }) => {
                    onChange?.(editor.getJSON());
                }}
                editorProps={{
                    handlePaste: (view, event) => {
                        const handled = handleImagePaste(view, event, imageUploadFn);
                        if (handled) return true;

                        const text = event.clipboardData?.getData('text/plain');
                        if (!text) return false;

                        // 이미지 URL인 경우
                        if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text)) {
                            event.preventDefault();
                            const { state, dispatch } = view;
                            const imageNode = state.schema.nodes.image.create({
                                src: text,
                            });
                            const transaction = state.tr.replaceSelectionWith(imageNode);
                            dispatch(transaction);
                            return true;
                        }

                        // YouTube URL인 경우
                        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                        const youtubeMatch = text.match(youtubeRegex);
                        if (youtubeMatch) {
                            event.preventDefault();
                            const { state, dispatch } = view;
                            const videoId = youtubeMatch[1];
                            const youtubeNode = state.schema.nodes.youtube.create({
                                src: `https://www.youtube.com/embed/${videoId}`,
                            });
                            const transaction = state.tr.replaceSelectionWith(youtubeNode);
                            dispatch(transaction);
                            return true;
                        }

                        return false;
                    },
                    handleDrop: (view, event, slice, moved) => {
                        return handleImageDrop(view, event, moved, imageUploadFn);
                    },
                    attributes: {
                        class: 'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
                    },
                }}
                className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
            >
                <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 px-1 py-2 shadow-md">
                    <EditorCommandEmpty className="px-2 text-sm text-slate-400">결과 없음</EditorCommandEmpty>
                    <EditorCommandList>
                        {suggestionItems.map((item) => (
                            <EditorCommandItem
                                value={item.title}
                                onCommand={(val) => {
                                    item.command?.(val);
                                }}
                                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-800 aria-selected:bg-slate-800 text-slate-200"
                                key={item.title}>
                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-xs text-slate-400">{item.description}</p>
                                </div>
                            </EditorCommandItem>
                        ))}
                    </EditorCommandList>
                </EditorCommand>

                <BubbleMenu />
            </EditorContent>
        </EditorRoot>
    );
}
