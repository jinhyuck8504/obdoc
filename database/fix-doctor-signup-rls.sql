-- ========================================
-- 의사 가입 RLS 정책 수정
-- 실행일: 2025-01-08
-- 목적: 의사 가입 시 401 오류 해결
-- ========================================

-- 기존 doctors 테이블 INSERT 정책 삭제
DROP POLICY IF EXISTS "Allow doctor registration" ON doctors;

-- 새로운 doctors 테이블 INSERT 정책 생성 (더 유연하게)
CREATE POLICY "Allow doctor registration" ON doctors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- customers 테이블 INSERT 정책도 동일하게 수정
DROP POLICY IF EXISTS "Doctors can create customers" ON customers;

CREATE POLICY "Allow customer registration" ON customers
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- 기존 정책 유지하면서 추가 정책 생성
CREATE POLICY "Doctors can create customers for their practice" ON customers
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

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
WHERE tablename IN ('doctors', 'customers')
ORDER BY tablename, policyname;
-- ========================================
-- hospital_signup_codes 테이블 RLS 정책 추가
-- ========================================

-- RLS 활성화
ALTER TABLE hospital_signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage ENABLE ROW LEVEL SECURITY;

-- hospital_signup_codes 정책
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

-- 코드 검증을 위한 공개 읽기 정책 (활성 코드만)
CREATE POLICY "Public can verify active codes" ON hospital_signup_codes
  FOR SELECT USING (is_active = true);

-- hospital_signup_code_usage 정책
CREATE POLICY "Doctors can view code usage" ON hospital_signup_code_usage
  FOR SELECT USING (
    code_id IN (SELECT id FROM hospital_signup_codes WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Allow code usage recording" ON hospital_signup_code_usage
  FOR INSERT WITH CHECK (true); -- 가입 시 사용 기록을 위해 허용

-- 관리자는 모든 작업 가능
CREATE POLICY "Admins can manage all codes" ON hospital_signup_codes
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can manage all code usage" ON hospital_signup_code_usage
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));