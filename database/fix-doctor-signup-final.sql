-- 의사 가입 401 오류 최종 해결 SQL
-- 모든 관련 정책을 완전히 제거하고 최소한의 정책만 생성

-- 1. 모든 기존 정책 완전 제거
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

-- 2. RLS 비활성화 후 재활성화 (정책 초기화)
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage DISABLE ROW LEVEL SECURITY;

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage ENABLE ROW LEVEL SECURITY;

-- 3. 최소한의 필수 정책만 생성

-- doctors 테이블: 가입 허용 (매우 관대한 정책)
CREATE POLICY "allow_doctor_insert" ON doctors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_doctor_select" ON doctors
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "allow_doctor_update" ON doctors
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- customers 테이블: 가입 허용 (매우 관대한 정책)
CREATE POLICY "allow_customer_insert" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_customer_select" ON customers
  FOR SELECT USING (
    user_id = auth.uid() OR 
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "allow_customer_update" ON customers
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- hospital_signup_codes 테이블: 기본 정책
CREATE POLICY "allow_code_select" ON hospital_signup_codes
  FOR SELECT USING (
    is_active = true OR
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "allow_code_insert" ON hospital_signup_codes
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "allow_code_update" ON hospital_signup_codes
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- hospital_signup_code_usage 테이블: 사용 기록 허용
CREATE POLICY "allow_usage_insert" ON hospital_signup_code_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_usage_select" ON hospital_signup_code_usage
  FOR SELECT USING (
    code_id IN (SELECT id FROM hospital_signup_codes WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- 4. 관리자 전체 권한 정책
CREATE POLICY "admin_full_access_doctors" ON doctors
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "admin_full_access_customers" ON customers
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "admin_full_access_codes" ON hospital_signup_codes
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "admin_full_access_usage" ON hospital_signup_code_usage
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 5. 정책 확인
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