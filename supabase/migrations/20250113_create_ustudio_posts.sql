CREATE TABLE ustudio_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  thumbnail_url TEXT,
  locale TEXT DEFAULT 'ko' CHECK (locale IN ('ko', 'en')),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  author_id UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX ustudio_idx_posts_locale_slug ON ustudio_posts(locale, slug);
CREATE INDEX ustudio_idx_posts_published ON ustudio_posts(is_published, published_at DESC);

-- RLS 정책
ALTER TABLE ustudio_posts ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 (발행된 포스트만)
CREATE POLICY "Public posts are viewable by everyone"
  ON ustudio_posts FOR SELECT
  USING (is_published = true);

-- 작성자 읽기 (미발행 포스트)
CREATE POLICY "Authors can view their own posts"
  ON ustudio_posts FOR SELECT
  USING (auth.uid() = author_id);

-- 작성자만 생성/수정/삭제
CREATE POLICY "Authors can insert their own posts"
  ON ustudio_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON ustudio_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON ustudio_posts FOR DELETE
  USING (auth.uid() = author_id);
