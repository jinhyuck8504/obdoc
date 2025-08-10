-- ========================================
-- 🧹 OBDOC MVP 정식 서비스 배포 전 데이터 정리
-- 실행일: 2025-01-08
-- 목적: 깔끔한 시작을 위한 테스트 데이터 정리
-- ========================================

-- 🚨 주의: 이 스크립트는 테스트 데이터를 삭제합니다.
-- 실행 전 반드시 백업을 확인하세요.

-- ========================================
-- 1️⃣ 테스트 구독 데이터 삭제
-- ========================================
DELETE FROM subscriptions 
WHERE 
  notes LIKE '%테스트%' 
  OR notes LIKE '%더미%' 
  OR notes LIKE '%샘플%'
  OR notes LIKE '%test%'
  OR notes LIKE '%sample%'
  OR notes LIKE '%dummy%'
  OR amount IN (199000, 999000, 1599000);  -- 샘플 금액

-- ========================================
-- 2️⃣ 테스트 예약/커뮤니티 데이터 삭제
-- ========================================
DELETE FROM appointments 
WHERE 
  notes LIKE '%테스트%'
  OR notes LIKE '%더미%'
  OR notes LIKE '%샘플%';

DELETE FROM community_posts 
WHERE 
  title LIKE '%테스트%'
  OR title LIKE '%더미%'
  OR title LIKE '%샘플%'
  OR content LIKE '%테스트%'
  OR content LIKE '%더미%'
  OR content LIKE '%샘플%';

DELETE FROM community_comments 
WHERE 
  content LIKE '%테스트%'
  OR content LIKE '%더미%'
  OR content LIKE '%샘플%';

-- ========================================
-- 3️⃣ 테스트 고객 계정 삭제 (이름 기준)
-- ========================================
-- 테스트 고객 계정 삭제 (customers 테이블의 name 컬럼 사용)
DELETE FROM customers 
WHERE 
  name LIKE '%테스트%'
  OR name LIKE '%더미%'
  OR name LIKE '%샘플%'
  OR name LIKE '%test%'
  OR name LIKE '%sample%'
  OR name LIKE '%dummy%';

-- ========================================
-- 4️⃣ 테스트 사용자 계정 삭제 (이메일 기준)
-- ========================================
-- 테스트 의사 계정 삭제
DELETE FROM doctors 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE 
    (email LIKE '%test%'
    OR email LIKE '%dummy%'
    OR email LIKE '%sample%')
    AND email != 'jinhyucks@gmail.com'
);

-- 테스트 사용자 계정 삭제 (관리자 계정 보호)
DELETE FROM users 
WHERE 
  (email LIKE '%test%'
  OR email LIKE '%dummy%'
  OR email LIKE '%sample%')
  AND email != 'jinhyucks@gmail.com'
  AND role != 'admin';

-- ========================================
-- 5️⃣ 관리자 계정 설정 확인
-- ========================================
UPDATE users 
SET 
  is_active = true,
  role = 'admin',
  updated_at = NOW()
WHERE email = 'jinhyucks@gmail.com';

-- ========================================
-- 6️⃣ 병원 가입 코드 테스트 데이터 정리
-- ========================================
DELETE FROM hospital_signup_codes 
WHERE 
  name LIKE '%테스트%'
  OR name LIKE '%더미%'
  OR name LIKE '%샘플%';

-- ========================================
-- 📊 정리 결과 확인
-- ========================================
-- 남은 데이터 확인
SELECT 
  'users' as table_name, 
  COUNT(*) as count,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctor_count,
  COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count
FROM users
UNION ALL
SELECT 'doctors', COUNT(*), 0, 0, 0 FROM doctors
UNION ALL
SELECT 'customers', COUNT(*), 0, 0, 0 FROM customers
UNION ALL
SELECT 'subscriptions', COUNT(*), 0, 0, 0 FROM subscriptions
UNION ALL
SELECT 'appointments', COUNT(*), 0, 0, 0 FROM appointments
UNION ALL
SELECT 'community_posts', COUNT(*), 0, 0, 0 FROM community_posts
UNION ALL
SELECT 'hospital_signup_codes', COUNT(*), 0, 0, 0 FROM hospital_signup_codes;

-- 관리자 계정 확인
SELECT 
  id, email, role, is_active, created_at
FROM users 
WHERE role = 'admin' OR email = 'jinhyucks@gmail.com';

-- ========================================
-- ✅ 정리 완료!
-- ========================================
-- 🎯 다음 단계:
-- 1. 실제 의사 회원가입 테스트
-- 2. 실제 고객 회원가입 테스트  
-- 3. 서비스 기능 최종 점검
-- 4. 마케팅 시작 🚀
-- ========================================