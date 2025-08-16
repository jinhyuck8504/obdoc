-- ============================================================================
-- OBDOC MVP - Row Level Security (RLS) 정책 (수정된 버전)
-- ============================================================================
-- 버전: 1.1
-- 생성일: 2025-01-11
-- 설명: 역할 기반 데이터 접근 제어를 위한 보안 정책 (auth 스키마 오류 수정)
-- 실행 순서: schema-clean.sql 실행 후에 이 파일을 실행하세요
-- ============================================================================

-- ============================================================================
-- 1. RLS 활성화
-- ============================================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_signup_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. 보안 헬퍼 함수들 (public 스키마에 생성)
-- ============================================================================

-- 현재 사용자의 역할 확인
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- 관리자 권한 확인
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 의사 권한 확인
CREATE OR REPLACE FUNCTION public.is_doctor() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 고객 권한 확인
CREATE OR REPLACE FUNCTION public.is_customer() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'customer'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 현재 사용자의 의사 ID 가져오기
CREATE OR REPLACE FUNCTION public.get_current_doctor_id() 
RETURNS UUID AS $$
  SELECT id FROM doctors WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- 현재 사용자의 고객 ID 가져오기
CREATE OR REPLACE FUNCTION public.get_current_customer_id() 
RETURNS UUID AS $$
  SELECT id FROM customers WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- 3. USERS 테이블 정책
-- ============================================================================

-- 사용자는 자신의 프로필만 조회 가능, 관리자는 모든 사용자 조회 가능
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- 사용자는 자신의 프로필만 수정 가능, 관리자는 모든 사용자 수정 가능
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- 새 사용자 등록 허용 (회원가입)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 4. DOCTORS 테이블 정책
-- ============================================================================

-- 의사는 자신의 데이터만 조회, 관리자는 모든 의사 조회 가능
CREATE POLICY "doctors_select_policy" ON doctors
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- 의사는 자신의 데이터만 수정 가능
CREATE POLICY "doctors_update_policy" ON doctors
  FOR UPDATE USING (user_id = auth.uid());

-- 의사 등록 허용 (의사 역할 사용자만)
CREATE POLICY "doctors_insert_policy" ON doctors
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    auth.uid() IN (SELECT id FROM users WHERE role = 'doctor')
  );

-- 관리자는 모든 의사 데이터 관리 가능
CREATE POLICY "doctors_admin_policy" ON doctors
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- 5. CUSTOMERS 테이블 정책
-- ============================================================================

-- 고객은 자신의 데이터, 의사는 자신의 고객 데이터, 관리자는 모든 데이터 조회 가능
CREATE POLICY "customers_select_policy" ON customers
  FOR SELECT USING (
    user_id = auth.uid() OR
    doctor_id = public.get_current_doctor_id() OR
    public.is_admin()
  );

-- 고객은 자신의 데이터만 수정 가능
CREATE POLICY "customers_update_policy" ON customers
  FOR UPDATE USING (user_id = auth.uid());

-- 의사는 자신의 고객 생성 가능, 관리자는 모든 고객 관리 가능
CREATE POLICY "customers_insert_policy" ON customers
  FOR INSERT WITH CHECK (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- 의사와 관리자는 고객 데이터 관리 가능
CREATE POLICY "customers_doctor_admin_policy" ON customers
  FOR ALL USING (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- ============================================================================
-- 6. WEIGHT_RECORDS 테이블 정책
-- ============================================================================

-- 고객은 자신의 기록, 의사는 자신의 고객 기록, 관리자는 모든 기록 조회 가능
CREATE POLICY "weight_records_select_policy" ON weight_records
  FOR SELECT USING (
    customer_id = public.get_current_customer_id() OR
    customer_id IN (
      SELECT id FROM customers WHERE doctor_id = public.get_current_doctor_id()
    ) OR
    public.is_admin()
  );

-- 고객은 자신의 체중 기록만 생성 가능
CREATE POLICY "weight_records_insert_policy" ON weight_records
  FOR INSERT WITH CHECK (
    customer_id = public.get_current_customer_id()
  );

-- 의사와 관리자는 고객의 체중 기록 관리 가능
CREATE POLICY "weight_records_doctor_admin_policy" ON weight_records
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE doctor_id = public.get_current_doctor_id()
    ) OR
    public.is_admin()
  );

-- ============================================================================
-- 7. APPOINTMENTS 테이블 정책
-- ============================================================================

-- 의사는 자신의 예약, 고객은 자신의 예약, 관리자는 모든 예약 조회 가능
CREATE POLICY "appointments_select_policy" ON appointments
  FOR SELECT USING (
    doctor_id = public.get_current_doctor_id() OR
    customer_id = public.get_current_customer_id() OR
    public.is_admin()
  );

-- 고객은 예약 생성 가능
CREATE POLICY "appointments_insert_policy" ON appointments
  FOR INSERT WITH CHECK (
    customer_id = public.get_current_customer_id()
  );

-- 의사와 관리자는 예약 관리 가능
CREATE POLICY "appointments_doctor_admin_policy" ON appointments
  FOR ALL USING (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- ============================================================================
-- 8. COMMUNITY_POSTS 테이블 정책
-- ============================================================================

-- 모든 고객은 커뮤니티 게시글 조회 가능, 관리자도 조회 가능
CREATE POLICY "community_posts_select_policy" ON community_posts
  FOR SELECT USING (
    public.is_customer() OR public.is_admin()
  );

-- 고객은 게시글 작성 가능
CREATE POLICY "community_posts_insert_policy" ON community_posts
  FOR INSERT WITH CHECK (
    customer_id = public.get_current_customer_id()
  );

-- 작성자는 자신의 게시글 수정 가능
CREATE POLICY "community_posts_update_policy" ON community_posts
  FOR UPDATE USING (
    customer_id = public.get_current_customer_id()
  );

-- 작성자와 관리자는 게시글 삭제 가능
CREATE POLICY "community_posts_delete_policy" ON community_posts
  FOR DELETE USING (
    customer_id = public.get_current_customer_id() OR public.is_admin()
  );

-- ============================================================================
-- 9. COMMUNITY_COMMENTS 테이블 정책
-- ============================================================================

-- 모든 고객은 댓글 조회 가능, 관리자도 조회 가능
CREATE POLICY "community_comments_select_policy" ON community_comments
  FOR SELECT USING (
    public.is_customer() OR public.is_admin()
  );

-- 고객은 댓글 작성 가능
CREATE POLICY "community_comments_insert_policy" ON community_comments
  FOR INSERT WITH CHECK (
    customer_id = public.get_current_customer_id()
  );

-- 작성자는 자신의 댓글 수정 가능
CREATE POLICY "community_comments_update_policy" ON community_comments
  FOR UPDATE USING (
    customer_id = public.get_current_customer_id()
  );

-- 작성자와 관리자는 댓글 삭제 가능
CREATE POLICY "community_comments_delete_policy" ON community_comments
  FOR DELETE USING (
    customer_id = public.get_current_customer_id() OR public.is_admin()
  );

-- ============================================================================
-- 10. HOSPITAL_SIGNUP_CODES 테이블 정책
-- ============================================================================

-- 의사는 자신의 코드만 조회, 관리자는 모든 코드 조회 가능
CREATE POLICY "hospital_signup_codes_select_policy" ON hospital_signup_codes
  FOR SELECT USING (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- 의사는 자신의 코드 생성 가능
CREATE POLICY "hospital_signup_codes_insert_policy" ON hospital_signup_codes
  FOR INSERT WITH CHECK (
    doctor_id = public.get_current_doctor_id()
  );

-- 의사는 자신의 코드 관리 가능, 관리자는 모든 코드 관리 가능
CREATE POLICY "hospital_signup_codes_doctor_admin_policy" ON hospital_signup_codes
  FOR ALL USING (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- ============================================================================
-- 11. HOSPITAL_SIGNUP_CODE_USAGE 테이블 정책
-- ============================================================================

-- 의사는 자신의 코드 사용 로그 조회, 관리자는 모든 로그 조회 가능
CREATE POLICY "hospital_signup_code_usage_select_policy" ON hospital_signup_code_usage
  FOR SELECT USING (
    code_id IN (
      SELECT id FROM hospital_signup_codes WHERE doctor_id = public.get_current_doctor_id()
    ) OR
    public.is_admin()
  );

-- 시스템에서 자동으로 로그 생성 (일반적으로 애플리케이션 레벨에서 처리)
CREATE POLICY "hospital_signup_code_usage_insert_policy" ON hospital_signup_code_usage
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 12. SUBSCRIPTIONS 테이블 정책
-- ============================================================================

-- 의사는 자신의 구독 정보만 조회, 관리자는 모든 구독 조회 가능
CREATE POLICY "subscriptions_select_policy" ON subscriptions
  FOR SELECT USING (
    doctor_id = public.get_current_doctor_id() OR public.is_admin()
  );

-- 의사는 자신의 구독 생성 가능
CREATE POLICY "subscriptions_insert_policy" ON subscriptions
  FOR INSERT WITH CHECK (
    doctor_id = public.get_current_doctor_id()
  );

-- 관리자는 모든 구독 관리 가능
CREATE POLICY "subscriptions_admin_policy" ON subscriptions
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- RLS 정책 설치 완료
-- ============================================================================
SELECT 'OBDOC MVP RLS 정책 설치가 완료되었습니다!' as message;