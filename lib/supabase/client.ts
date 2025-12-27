import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 유효한 키가 없을 경우 더미 값으로 초기화하여 UI 렌더링 에러 방지
    if (!url || !key || url.includes('your_supabase_url')) {
        return createBrowserClient(
            'https://placeholder-project.supabase.co',
            'placeholder-key'
        );
    }

    return createBrowserClient(url, key);
}
