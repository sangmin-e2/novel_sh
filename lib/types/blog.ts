import type { JSONContent } from '@tiptap/core';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;
  thumbnail_url: string | null;
  locale: 'ko' | 'en';
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  content: JSONContent;
  thumbnail_url?: string | null;
  locale?: 'ko' | 'en';
  is_published?: boolean;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}
