-- Supabase 데이터베이스 완전 초기화 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행하면 모든 사용자 정의 요소가 삭제됩니다

-- 1. 모든 사용자 정의 테이블 삭제 (CASCADE로 관련 요소들도 함께 삭제)
DROP TABLE IF EXISTS hospital_signup_code_usage CASCADE;
DROP TABLE IF EXISTS hospital_signup_codes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS weight_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 챌린지 시스템 테이블들 삭제 (있다면)
DROP TABLE IF EXISTS challenge_participations CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- 3. 모든 사용자 정의 함수 삭제
DROP FUNCTION IF EXISTS increment_code_usage(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.is_admin();
DROP FUNCTION IF EXISTS auth.is_doctor();
DROP FUNCTION IF EXISTS auth.is_customer();
DROP FUNCTION IF EXISTS auth.get_doctor_id();
DROP FUNCTION IF EXISTS auth.get_customer_id();
DROP FUNCTION IF EXISTS test_rls_policies();

-- 4. 모든 사용자 정의 타입 삭제 (있다면)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- 5. 확장 기능 정리 (필요한 것만 유지)
-- uuid-ossp는 유지 (필요함)

-- 초기화 완료 메시지
SELECT 'Database reset completed successfully!' as message;