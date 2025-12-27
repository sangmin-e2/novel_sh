'use client';

import { useState, useEffect, useRef } from 'react';

interface PostViewerProps {
    htmlContent: string;
}

export default function PostViewer({ htmlContent }: PostViewerProps) {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // 이미지 클릭 시 라이트박스 모달 열기 (이벤트 위임 사용)
    useEffect(() => {
        if (!contentRef.current) return;

        // 모든 이미지에 커서 스타일 추가
        const images = contentRef.current.querySelectorAll('img');
        images.forEach((img) => {
            (img as HTMLImageElement).style.cursor = 'pointer';
        });

        // 이벤트 위임: contentRef에 클릭 이벤트를 등록
        const handleContentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const image = target.closest('img');
            if (image && image.src) {
                e.preventDefault();
                e.stopPropagation();
                setLightboxImage(image.src);
            }
        };

        contentRef.current.addEventListener('click', handleContentClick);

        return () => {
            if (contentRef.current) {
                contentRef.current.removeEventListener('click', handleContentClick);
            }
        };
    }, [htmlContent]);

    // ESC 키로 라이트박스 닫기
    useEffect(() => {
        if (!lightboxImage) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxImage(null);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [lightboxImage]);

    return (
        <>
            <div
                ref={contentRef}
                className="prose prose-invert dark:prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-gray-100 prose-li:text-gray-200 max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* 이미지 라이트박스 모달 */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxImage(null)}
                >
                    {/* 닫기 버튼 */}
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white transition-colors z-10"
                        aria-label="닫기"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>

                    {/* 이미지 */}
                    <div
                        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxImage}
                            alt="확대 이미지"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
