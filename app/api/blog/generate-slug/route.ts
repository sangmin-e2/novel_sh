import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const title = body.title;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const locale = body.locale || 'ko';

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json(
                { error: '제목이 필요합니다.' },
                { status: 400 }
            );
        }

        // Gemini API 키 확인
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            // API 키가 없으면 fallback 슬러그 생성
            const fallbackSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .trim()
                .substring(0, 50);

            if (!fallbackSlug || fallbackSlug.length === 0) {
                return NextResponse.json(
                    { error: '슬러그를 생성할 수 없습니다.' },
                    { status: 400 }
                );
            }

            return NextResponse.json({ slug: fallbackSlug });
        }

        // 항상 영어 슬러그 생성 (한국어 제목도 영어로 번역 후 슬러그 생성)
        const prompt = `Generate a URL-friendly English slug for the following blog post title.

Requirements:
- If the title is in Korean or other languages, first translate it to English, then create the slug
- Use ONLY English letters (a-z), numbers (0-9), and hyphens (-)
- Convert to lowercase
- Replace spaces with hyphens
- Remove all special characters and non-English characters
- Keep it under 50 characters
- Make it SEO-friendly and concise
- The slug must be in English only, no Korean or other language characters

Title: "${title}"

Output ONLY the slug (no explanation, no quotes, just the slug text):`;

        const google = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        const { text: slug } = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt,
        });

        // 생성된 슬러그 정제
        const cleanedSlug = slug
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);

        if (!cleanedSlug || cleanedSlug.length === 0) {
            // AI가 제대로 생성하지 못한 경우 기본 슬러그 생성
            const fallbackSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .trim()
                .substring(0, 50);

            return NextResponse.json({ slug: fallbackSlug });
        }

        return NextResponse.json({ slug: cleanedSlug });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error generating slug:', error);

        // API 키 관련 에러인 경우 fallback 슬러그 생성
        if (error.message?.includes('API key')) {
            const body = await request.json().catch(() => ({}));
            if (body.title) {
                const fallbackSlug = body.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .trim()
                    .substring(0, 50);

                if (fallbackSlug && fallbackSlug.length > 0) {
                    return NextResponse.json({ slug: fallbackSlug });
                }
            }
        }

        return NextResponse.json(
            { error: error.message || '슬러그 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
