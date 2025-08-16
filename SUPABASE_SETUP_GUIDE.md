# Supabase 프로덕션 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: `obdoc-mvp-production`
   - **Database Password**: 강력한 비밀번호 생성 (저장해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 또는 `Southeast Asia (Singapore)`
4. "Create new project" 클릭하고 생성 완료까지 대기 (약 2분)

## 2. 데이터베이스 스키마 설정

### 2.1 스키마 생성
1. Supabase 대시보드 → **SQL Editor** 이동
2. "New query" 클릭
3. `database/schema-clean.sql` 파일 내용을 복사해서 붙여넣기
4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인

### 2.2 RLS 정책 적용
1. 새로운 쿼리 생성
2. `database/rls-policies-fixed.sql` 파일 내용을 복사해서 붙여넣기
3. **Run** 버튼 클릭하여 실행
4. 모든 정책이 성공적으로 생성되었는지 확인

### 2.3 초기 데이터 설정
1. 새로운 쿼리 생성
2. `database/production-init.sql` 파일 내용을 복사해서 붙여넣기
3. **Run** 버튼 클릭하여 실행

## 3. 인증 설정

1. Supabase 대시보드 → **Authentication** → **Settings** 이동
2. **Site URL** 설정:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`
3. **Redirect URLs** 추가:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
4. **Email** 탭에서:
   - "Enable email confirmations" 비활성화 (개발 단계)
   - 나중에 SMTP 설정 후 활성화

## 4. API 키 확인

1. Supabase 대시보드 → **Settings** → **API** 이동
2. 다음 정보를 복사해두세요:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (공개 키)
   - **service_role**: `eyJ...` (서비스 키, 민감정보!)

## 5. 환경 변수 설정

### 5.1 로컬 개발 환경
1. `.env.production.template` 파일을 `.env.local`로 복사
2. 실제 값들로 교체:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5.2 Netlify 배포 환경
1. Netlify 대시보드 → 사이트 선택 → **Site settings** → **Environment variables**
2. 다음 변수들 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (민감한 정보로 설정)
   - `NEXT_PUBLIC_APP_URL`

## 6. 관리자 계정 생성

### 6.1 Supabase Auth에서 사용자 생성
1. Supabase 대시보드 → **Authentication** → **Users** 이동
2. "Add user" 클릭
3. 관리자 정보 입력:
   - **Email**: `admin@obdoc.com`
   - **Password**: `admin123!@#`
   - "Auto Confirm User" 체크
4. "Create user" 클릭

### 6.2 사용자 ID 확인 및 데이터 업데이트
1. 생성된 사용자의 **User UID** 복사
2. SQL Editor에서 다음 쿼리 실행:
```sql
-- UUID를 실제 생성된 값으로 교체
UPDATE users SET id = 'actual-user-uuid-here' 
WHERE email = 'admin@obdoc.com';
```

## 7. 연결 테스트

### 7.1 로컬 테스트
```bash
npm run dev
```
브라우저 콘솔에서 Supabase 연결 상태 확인

### 7.2 관리자 로그인 테스트
1. `/login` 페이지 접속
2. `admin@obdoc.com` / `admin123!@#`로 로그인
3. 관리자 대시보드 접근 확인

## 8. 문제 해결

### 연결 오류
- API 키가 올바른지 확인
- 프로젝트 URL이 정확한지 확인
- 환경 변수가 제대로 설정되었는지 확인

### 인증 오류
- Site URL과 Redirect URL이 올바른지 확인
- 사용자가 Supabase Auth에 존재하는지 확인

### RLS 오류
- 모든 RLS 정책이 올바르게 생성되었는지 확인
- 사용자 역할이 올바르게 설정되었는지 확인

## 9. 보안 체크리스트

- [ ] Service Role Key는 서버 환경에서만 사용
- [ ] 환경 변수 파일(.env.local)은 Git에 커밋하지 않음
- [ ] RLS 정책이 모든 테이블에 적용됨
- [ ] 관리자 계정 비밀번호가 강력함
- [ ] HTTPS 사용 (프로덕션)

## 완료!

모든 설정이 완료되면 실제 Supabase 데이터베이스와 연결된 상태로 애플리케이션이 작동합니다.