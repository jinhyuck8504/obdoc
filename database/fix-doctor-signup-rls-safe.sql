-- 의사 가입 RLS 정책 수정 (안전한 버전)
-- 기존 정책들을 모두 삭제하고 새로 생성

-- 1. doctors 테이블 정책 수정
DROP POLICY IF EXISTS "Allow doctor registration" ON doctors;

CREATE POLICY "Allow doctor registration" ON doctors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- 2. customers 테이블 정책 수정
DROP POLICY IF EXISTS "Doctors can create customers" ON customers;
DROP POLICY IF EXISTS "Allow customer registration" ON customers;
DROP POLICY IF EXISTS "Doctors can create customers for their practice" ON customers;

CREATE POLICY "Allow customer registration" ON customers
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Doctors can create customers for their practice" ON customers
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- 3. hospital_signup_codes 테이블 RLS 활성화 및 정책 설정
ALTER TABLE hospital_signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage ENABLE ROW LEVEL SECURITY;

-- 기존 hospital_signup_codes 정책들 삭제
DROP POLICY IF EXISTS "Doctors can view own codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Doctors can create codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Doctors can update own codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Doctors can delete own codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Public can verify active codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Admins can manage all codes" ON hospital_signup_codes;

-- 새로운 hospital_signup_codes 정책들 생성
CREATE POLICY "Doctors can view own codes" ON hospital_signup_codes
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Doctors can create codes" ON hospital_signup_codes
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can update own codes" ON hospital_signup_codes
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Doctors can delete own codes" ON hospital_signup_codes
  FOR DELETE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Public can verify active codes" ON hospital_signup_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all codes" ON hospital_signup_codes
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 기존 hospital_signup_code_usage 정책들 삭제
DROP POLICY IF EXISTS "Doctors can view code usage" ON hospital_signup_code_usage;
DROP POLICY IF EXISTS "Allow code usage recording" ON hospital_signup_code_usage;
DROP POLICY IF EXISTS "Admins can manage all code usage" ON hospital_signup_code_usage;

-- 새로운 hospital_signup_code_usage 정책들 생성
CREATE POLICY "Doctors can view code usage" ON hospital_signup_code_usage
  FOR SELECT USING (
    code_id IN (SELECT id FROM hospital_signup_codes WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Allow code usage recording" ON hospital_signup_code_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all code usage" ON hospital_signup_code_usage
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 정책 확인 쿼리
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