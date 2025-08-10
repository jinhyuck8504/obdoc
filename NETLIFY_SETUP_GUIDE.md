# Netlify 연동 설정 가이드

## 1. Netlify 계정 준비

### 계정 생성
1. [Netlify](https://netlify.com)에 접속
2. "Sign up" 클릭
3. GitHub 계정으로 로그인 (권장)

### GitHub 권한 설정
1. Netlify 대시보드에서 "New site from Git" 클릭
2. "GitHub" 선택
3. 필요한 권한 승인

## 2. 사이트 생성 및 연결

### 리포지토리 연결
1. Netlify 대시보드 → "Add new site" → "Import an existing project"
2. "Deploy with GitHub" 선택
3. `obdoc` 리포지토리 선택
4. 배포 설정:
   ```
   Branch to deploy: main
   Build command: npm run build
   Publish directory: .next
   ```

### 고급 빌드 설정
```toml
# netlify.toml 파일이 자동으로 적용됩니다
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
```

## 3. 환경 변수 설정

### Netlify 대시보드에서 설정
1. Site settings → Environment variables
2. "Add a variable" 클릭
3. 다음 변수들을 추가:

#### 필수 환경 변수
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-actual-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# AI 서비스 (선택사항)
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
GOOGLE_AI_API_KEY=your-google-ai-key

# 기능 플래그
CHALLENGES_ENABLED=true
AI_ANALYSIS_ENABLED=true

# 환경 설정
NODE_ENV=production
```

#### GitHub Actions 연동을 위한 추가 변수
```bash
# Netlify API 토큰 (GitHub Secrets에 추가)
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id
```

## 4. 도메인 설정

### 기본 도메인
- Netlify에서 자동으로 `random-name.netlify.app` 형태의 도메인 제공
- Site settings → Domain management에서 확인 가능

### 커스텀 도메인 (선택사항)
1. Site settings → Domain management
2. "Add custom domain" 클릭
3. 도메인 입력 (예: `obdoc.com`)
4. DNS 설정:
   ```
   Type: CNAME
   Name: www (또는 @)
   Value: your-site-name.netlify.app
   ```

### SSL 인증서
- Netlify에서 자동으로 Let's Encrypt SSL 인증서 제공
- HTTPS 강제 설정 권장

## 5. 빌드 최적화

### 빌드 성능 향상
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
  # 빌드 캐시 활용
  NPM_CONFIG_CACHE = ".npm"
  NEXT_TELEMETRY_DISABLED = "1"
```

### 캐시 설정
```toml
# 정적 자산 캐시
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# 이미지 캐시
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

## 6. 배포 자동화

### GitHub Actions 연동
1. GitHub 리포지토리 → Settings → Secrets
2. 다음 시크릿 추가:
   ```
   NETLIFY_AUTH_TOKEN: Netlify Personal Access Token
   NETLIFY_SITE_ID: Netlify Site ID
   ```

### Netlify Personal Access Token 생성
1. Netlify → User settings → Personal access tokens
2. "New access token" 클릭
3. 토큰 이름 입력 후 생성
4. 생성된 토큰을 GitHub Secrets에 추가

### Site ID 확인
1. Netlify 사이트 대시보드
2. Site settings → General
3. "Site information" 섹션에서 Site ID 확인

## 7. 모니터링 및 알림

### 배포 알림 설정
1. Site settings → Build & deploy → Deploy notifications
2. 다음 알림 추가:
   - 배포 성공 시 Slack/Discord 알림
   - 배포 실패 시 이메일 알림
   - GitHub 커밋 상태 업데이트

### 성능 모니터링
1. Site overview → Analytics 탭
2. 다음 지표 모니터링:
   - 페이지 로드 시간
   - 방문자 수
   - 대역폭 사용량
   - 빌드 시간

## 8. 보안 설정

### 보안 헤더
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

### 환경 변수 보안
- 민감한 정보는 절대 코드에 포함하지 않기
- Netlify 환경 변수만 사용
- 정기적으로 API 키 로테이션

## 9. 트러블슈팅

### 일반적인 문제들

#### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 문제 해결
npm ci
npm run build
```

#### 환경 변수 문제
1. Netlify 대시보드에서 환경 변수 확인
2. 변수명 오타 확인
3. 값에 특수문자가 있는 경우 따옴표로 감싸기

#### 도메인 연결 문제
1. DNS 설정 확인
2. DNS 전파 시간 대기 (최대 48시간)
3. Netlify DNS 사용 고려

### 로그 확인
1. Site overview → Deploys
2. 실패한 배포 클릭
3. "Deploy log" 확인
4. 오류 메시지 분석

## 10. 성능 최적화

### 빌드 시간 단축
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build"
  }
}
```

### 번들 크기 최적화
1. Next.js Bundle Analyzer 사용
2. 불필요한 의존성 제거
3. 코드 스플리팅 적용
4. 이미지 최적화

## 11. 다음 단계

배포 완료 후 확인사항:
1. ✅ 사이트 접속 테스트
2. ✅ 모든 페이지 동작 확인
3. ✅ API 연결 테스트
4. ✅ 모바일 반응형 확인
5. ✅ 성능 점수 측정
6. ✅ SEO 최적화 확인

---

**참고**: 첫 배포 후에는 몇 분 정도 기다린 후 사이트에 접속해보세요. DNS 전파와 CDN 캐시 때문에 즉시 반영되지 않을 수 있습니다.