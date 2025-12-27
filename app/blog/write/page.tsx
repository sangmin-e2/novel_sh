'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { JSONContent } from '@tiptap/core';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { createClient } from '@/lib/supabase/client';

// Editor는 CSR 전용이므로 dynamic import
const BlogEditor = dynamic(() => import('@/components/editor/BlogEditor'), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full animate-pulse bg-slate-100 rounded-lg" />,
});

export default function BlogWritePage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const supabase = createClient();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState<JSONContent>({});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [postId, setPostId] = useState<string | null>(null);
    const [generatingSlug, setGeneratingSlug] = useState(false);
    const locale = 'ko';

    // 실시간 저장 (초안 저장용)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { saveStatus, lastSaved, triggerSave } = useAutoSave({
        docId: postId || 'draft',
        debounceMs: 2000,
        onSave: async (savedContent, savedTitle) => {
            // 실제 API 호출 부분은 아직 backend 구현 전이므로 console.log로 대체하거나
            // Supabase 직접 호출 가능. 여기서는 데모용으로 console.log
            console.log('Saving post...', { title: savedTitle || title, content: savedContent });

            // const { data: { session } } = await supabase.auth.getSession();
            // if (!session) {
            //   // throw new Error('로그인이 필요합니다.');
            //   console.log('Not logged in, skipping server save');
            //   return;
            // }

            // Implement actual save logic here
        },
    });

    // slug 자동 생성 (Gemini API 사용)
    useEffect(() => {
        if (!title || title.trim().length === 0) {
            return;
        }

        // debounce: 1초 후에 슬러그 생성
        const timeoutId = setTimeout(async () => {
            // 사용자가 수동으로 슬러그를 수정한 경우 자동 생성하지 않음
            if (slug && slug.trim().length > 0) {
                return;
            }

            setGeneratingSlug(true);
            try {
                const response = await fetch('/api/blog/generate-slug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, locale }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.error) {
                        console.error('Slug generation error:', errorData.error);
                        return;
                    }
                    throw new Error('슬러그 생성에 실패했습니다.');
                }

                const data = await response.json();
                if (data.slug) {
                    setSlug(data.slug);
                }
            } catch (error: any) {
                console.error('Error generating slug:', error);
                // 에러 발생 시 기본 슬러그 생성 (영어만)
                const fallbackSlug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .trim();
                setSlug(fallbackSlug);
            } finally {
                setGeneratingSlug(false);
            }
        }, 1000); // 1초 debounce

        return () => clearTimeout(timeoutId);
    }, [title, locale, slug]);

    // 제목 변경 핸들러
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (content) {
            triggerSave(content, newTitle);
        }
    };

    // 본문 변경 핸들러
    const handleContentChange = (newContent: JSONContent) => {
        setContent(newContent);
        triggerSave(newContent, title);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">블로그 작성</h1>
                {/* 저장 상태 표시 */}
                <div className="flex items-center gap-2 text-xs">
                    {saveStatus === 'saving' && (
                        <span className="text-yellow-600">저장 중...</span>
                    )}
                    {saveStatus === 'saved' && lastSaved && (
                        <span className="text-green-600">
                            저장됨 {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600">저장 실패</span>
                    )}
                    {saveStatus === 'offline' && (
                        <span className="text-slate-600">오프라인 - 동기화 대기 중</span>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* 제목 입력 */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        제목
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                        placeholder="제목을 입력하세요"
                    />
                </div>

                {/* 슬러그 입력 */}
                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL 슬러그
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="slug"
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                            placeholder="url-slug"
                        />
                        {generatingSlug && (
                            <span className="flex items-center text-sm text-gray-500">
                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                생성 중...
                            </span>
                        )}
                    </div>
                </div>

                {/* 에디터 */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        내용
                    </label>
                    <BlogEditor
                        content={content}
                        onChange={handleContentChange}
                    />
                </div>
            </div>
        </div>
    );
}
