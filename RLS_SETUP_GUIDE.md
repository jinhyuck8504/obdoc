# RLS 정책 적용 가이드

## 개요
이 가이드는 Supabase 프로덕션 환경에 Row Level Security (RLS) 정책을 적용하는 방법을 설명합니다.

## 전제 조건
- Supabase 프로젝트가 생성되어 있어야 합니다
- 데이터베이스 스키마가 이미 적용되어 있어야 합니다 (`schema-clean.sql` 실행 완료)

## RLS 정책 적용 단계

### 1단계: Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. `obdoc-mvp-production` 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2단계: RLS 정책 SQL 실행
1. SQL Editor에서 **New query** 버튼 클릭
2. `database/rls-policies-fixed.sql` 파일의 전체 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭하여 실행

### 3단계: 실행 결과 확인
실행이 성공하면 다음과 같은 메시지가 표시됩니다:
```
OBDOC MVP RLS 정책 설치가 완료되었습니다!
```

### 4단계: RLS 활성화 확인
1. 좌측 메뉴에서 **Table Editor** 클릭
2. 각 테이블을 선택하고 **Settings** 탭에서 "Enable Row Level Security" 옵션이 활성화되어 있는지 확인

### 5단계: 정책 확인
1. 좌측 메뉴에서 **Authentication** > **Policies** 클릭
2. 각 테이블별로 정책이 올바르게 생성되었는지 확인

## 적용되는 보안 정책

### 사용자 역할별 접근 권한
- **관리자 (admin)**: 모든 데이터에 대한 전체 접근 권한
- **의사 (doctor)**: 자신의 데이터와 담당 고객의 데이터에만 접근
- **고객 (customer)**: 자신의 데이터에만 접근

### 테이블별 정책
- **users**: 사용자는 자신의 프로필만 관리
- **doctors**: 의사는 자신의 프로필만 관리
- **customers**: 고객은 자신의 데이터, 의사는 담당 고객 데이터 관리
- **weight_records**: 고객은 자신의 기록, 의사는 담당 고객의 기록 관리
- **appointments**: 예약 당사자(의사/고객)만 접근
- **community_posts/comments**: 고객만 작성/조회, 작성자만 수정/삭제
- **hospital_signup_codes**: 의사는 자신의 코드만 관리
- **subscriptions**: 의사는 자신의 구독 정보만 관리

## 문제 해결

### 정책 적용 실패 시
1. 스키마가 먼저 적용되었는지 확인
2. SQL 구문 오류가 없는지 확인
3. 필요시 개별 정책을 하나씩 실행

### 접근 권한 문제 시
1. 사용자의 역할(role)이 올바르게 설정되었는지 확인
2. 인증 상태가 유효한지 확인
3. 정책 조건이 올바른지 확인

## 다음 단계
RLS 정책 적용이 완료되면 다음 작업을 진행하세요:
1. 환경 변수에서 더미 클라이언트 비활성화
2. 실제 Supabase 클라이언트로 연결 테스트
3. 역할별 접근 권한 테스트