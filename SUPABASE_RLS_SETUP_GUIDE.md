# Supabase RLS 정책 적용 가이드

## 개요
이 가이드는 obdoc 프로젝트의 Row Level Security (RLS) 정책을 Supabase 프로덕션 환경에 적용하는 방법을 설명합니다.

## 사전 준비사항
- Supabase 프로젝트가 생성되어 있어야 함
- 데이터베이스 스키마가 이미 적용되어 있어야 함 (schema-clean.sql)
- Supabase 대시보드에 접근 권한이 있어야 함

## 적용 단계

### 1단계: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `obdoc-mvp-production` (또는 해당 프로젝트명)
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: RLS 정책 스크립트 실행
1. SQL Editor에서 "New query" 클릭
2. 아래 파일의 전체 내용을 복사하여 붙여넣기:
   - 파일 경로: `obdoc/database/rls-policies-fixed.sql`
3. "Run" 버튼 클릭하여 실행

### 3단계: 실행 결과 확인
실행 후 다음과 같은 메시지가 표시되어야 합니다:
```
OBDOC MVP RLS 정책 설치가 완료되었습니다!
```

### 4단계: RLS 활성화 확인
1. 좌측 메뉴에서 "Table Editor" 클릭
2. 각 테이블을 선택하고 "Settings" 탭에서 "Row Level Security" 가 활성화되어 있는지 확인
3. 확인해야 할 테이블들:
   - users
   - doctors
   - customers
   - weight_records
   - appointments
   - community_posts
   - community_comments
   - hospital_signup_codes
   - hospital_signup_code_usage
   - subscriptions

### 5단계: 보안 함수 확인
1. SQL Editor에서 다음 쿼리를 실행하여 함수들이 생성되었는지 확인:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%' OR routine_name LIKE '%admin%' OR routine_name LIKE '%doctor%' OR routine_name LIKE '%customer%';
```

2. 다음 함수들이 존재해야 합니다:
   - get_user_role()
   - is_admin()
   - is_doctor()
   - is_customer()
   - get_current_doctor_id()
   - get_current_customer_id()

## 적용된 보안 정책 요약

### 사용자 역할별 접근 권한
- **관리자 (admin)**: 모든 데이터에 대한 전체 접근 권한
- **의사 (doctor)**: 자신의 데이터 + 자신의 고객 데이터 접근
- **고객 (customer)**: 자신의 데이터만 접근

### 테이블별 정책
1. **users**: 사용자는 자신의 프로필만 관리
2. **doctors**: 의사는 자신의 의사 정보만 관리
3. **customers**: 고객은 자신의 정보만, 의사는 자신의 고객 정보 관리
4. **weight_records**: 고객은 자신의 기록만, 의사는 자신의 고객 기록 관리
5. **appointments**: 예약 당사자(의사/고객)만 접근
6. **community_posts/comments**: 고객만 작성/조회, 작성자만 수정/삭제
7. **hospital_signup_codes**: 의사는 자신의 코드만 관리
8. **subscriptions**: 의사는 자신의 구독 정보만 관리

## 문제 해결

### 오류 발생 시
1. **함수 생성 오류**: 스키마가 먼저 적용되었는지 확인
2. **권한 오류**: Service Role 키로 실행하고 있는지 확인
3. **정책 충돌**: 기존 정책이 있다면 먼저 삭제 후 재실행

### 정책 재적용이 필요한 경우
```sql
-- 모든 정책 삭제 (필요시)
DROP POLICY IF EXISTS "users_select_policy" ON users;
-- (다른 정책들도 동일하게...)

-- 그 후 rls-policies-fixed.sql 재실행
```

## 다음 단계
RLS 정책 적용 완료 후:
1. 환경 변수 업데이트 확인
2. 로컬 개발 환경에서 연결 테스트
3. 사용자 인증 기능 테스트
4. 역할별 데이터 접근 권한 테스트

## 참고사항
- 이 정책들은 데이터 보안을 위해 매우 중요합니다
- 정책 수정 시에는 반드시 테스트를 거쳐야 합니다
- 프로덕션 환경에서는 더욱 신중하게 적용해야 합니다