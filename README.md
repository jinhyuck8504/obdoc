# OBDOC

의료진과 환자를 위한 통합 플랫폼

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, React 18
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Deployment**: Netlify
- **Styling**: Tailwind CSS

## 개발 환경 설정

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 빌드 및 배포

### 로컬 빌드
```bash
npm run build
npm run start
```

### Netlify 배포
1. GitHub에 코드 푸시
2. Netlify에서 새 사이트 생성
3. GitHub 리포지토리 연결
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. 환경 변수 설정

## 프로젝트 구조

```
obdoc/
├── src/
│   ├── app/           # Next.js App Router 페이지
│   ├── components/    # 재사용 가능한 컴포넌트
│   ├── lib/          # 유틸리티 함수 및 서비스
│   ├── types/        # TypeScript 타입 정의
│   └── styles/       # 스타일 파일
├── database/         # 데이터베이스 스키마 및 마이그레이션
├── public/          # 정적 자산
└── docs/           # 프로젝트 문서
```

## 주요 기능

- 사용자 인증 (의사, 환자, 관리자)
- 예약 관리 시스템
- 환자 건강 데이터 관리
- 실시간 커뮤니케이션
- 관리자 대시보드

## 라이센스

Private Project