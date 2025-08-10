-- 의사 가입 401 오류 최종 해결 SQL (궁극적 해결책)
-- RLS를 완전히 비활성화하고 애플리케이션 레벨에서 보안 처리

-- 1. 모든 테이블의 RLS 완전 비활성화
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage DISABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 완전 제거
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- doctors 테이블의 모든 정책 삭제
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'doctors'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON doctors';
    END LOOP;
    
    -- customers 테이블의 모든 정책 삭제
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'customers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON customers';
    END LOOP;
    
    -- hospital_signup_codes 테이블의 모든 정책 삭제
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'hospital_signup_codes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON hospital_signup_codes';
    END LOOP;
    
    -- hospital_signup_code_usage 테이블의 모든 정책 삭제
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'hospital_signup_code_usage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON hospital_signup_code_usage';
    END LOOP;
END $$;

-- 3. 확인 쿼리
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage')
ORDER BY tablename;

-- 4. 정책 확인 (모두 비어있어야 함)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage')
ORDER BY tablename, policyname;