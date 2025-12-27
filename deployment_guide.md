# Netlify Deployment Guide

이 가이드는 **Blog Editor** 프로젝트를 Netlify에 배포하는 방법을 설명합니다.

## 1. GitHub 저장소 연동

1. [Netlify](https://www.netlify.com/)에 로그인합니다.
2. 대시보드에서 **"Add new site"** > **"Import from existing project"**를 클릭합니다.
3. **GitHub**를 선택하고 권한을 승인합니다.
4. `sangmin-e2/novel_sh` 저장소를 검색하여 선택합니다.

## 2. 빌드 설정 (Build Settings)

`netlify.toml` 파일이 프로젝트에 포함되어 있으므로, 대부분의 설정은 자동으로 감지됩니다. 다음 내용이 맞는지 확인만 해주세요.

- **Base directory**: (비워둠)
- **Build command**: `npm run build`
- **Publish directory**: `.next`

## 3. 환경 변수 설정 (Environment Variables)

Netlify 배포 설정 화면에서 **"Environment variables"** 섹션을 찾아 다음 변수들을 추가해야 합니다. 이 값들은 로컬 개발 환경(`.env.local`)에서 사용하던 값과 동일해야 합니다.

| Key | Value (예시) | 설명 |
|-----|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxh...` | Supabase Anon Key (Public) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSy...` | Google Gemini API Key |

> **주의**: API 키는 보안에 민감하므로 절대 노출되지 않도록 주의하세요.

## 4. 배포 시작 (Deploy)

모든 설정이 완료되었으면 **"Deploy site"** 버튼을 클릭합니다.
Netlify가 프로젝트를 빌드하고 배포를 시작합니다.

## 5. 문제 해결 (Troubleshooting)

### 빌드 실패 시
- **Environment Variables**: 위 3번 단계에서 환경 변수를 올바르게 입력했는지 다시 확인하세요. 오타가 있거나 누락된 값이 있으면 빌드 또는 런타임 에러가 발생할 수 있습니다.
- **Build Log**: Netlify 대시보드의 "Deploys" 탭에서 실패한 배포의 로그를 확인하면 에러 원인을 파악할 수 있습니다.

### 배포 후 기능 오류
- **Supabase 연결**: `NEXT_PUBLIC_SUPABASE_URL`과 `Key`가 올바른지 확인하세요.
- **이미지 업로드 실패**: Supabase Storage 버킷(`blog-images`) 정책이 Public으로 설정되어 있는지 확인하세요.
