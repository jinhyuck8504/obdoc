# Netlify 배포 가이드

## 1. Netlify 사이트 생성

1. [Netlify](https://netlify.com)에 로그인
2. "New site from Git" 클릭
3. GitHub 리포지토리 연결
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`

## 2. 환경 변수 설정

Netlify 사이트 설정 > Environment variables에서 다음 변수들을 추가:

### 필수 환경 변수

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-actual-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-supabase-service-role-key

# AI Service Configuration (선택사항)
OPENAI_API_KEY=your-actual-openai-key
CLAUDE_API_KEY=your-actual-claude-key
GOOGLE_AI_API_KEY=your-actual-google-ai-key

# Feature Flags
CHALLENGES_ENABLED=true
AI_ANALYSIS_ENABLED=true

# Environment
NODE_ENV=production
```

## 3. 도메인 설정

1. Site settings > Domain management
2. 커스텀 도메인 추가 (선택사항)
3. HTTPS 자동 설정 확인

## 4. 빌드 설정 확인

`netlify.toml` 파일이 프로젝트 루트에 있는지 확인:
- Next.js 플러그인 자동 설정
- 리다이렉트 규칙 적용
- 보안 헤더 설정
- 캐시 최적화

## 5. 배포 테스트

1. GitHub에 코드 푸시
2. Netlify에서 자동 빌드 시작 확인
3. 빌드 로그에서 오류 확인
4. 배포된 사이트 접속 테스트

## 6. 트러블슈팅

### 빌드 실패 시
- Node.js 버전 확인 (18 이상)
- 환경 변수 설정 확인
- 의존성 설치 오류 확인

### 런타임 오류 시
- Supabase 연결 설정 확인
- 환경 변수 값 검증
- 브라우저 콘솔 오류 확인

## 7. 성능 최적화

- Netlify Analytics 활성화
- Edge Functions 활용 (필요시)
- CDN 캐시 설정 확인

## 8. 보안 설정

- 환경 변수 보안 확인
- HTTPS 강제 설정
- 보안 헤더 적용 확인