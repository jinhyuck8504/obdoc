-- ============================================================================
-- OBDOC MVP - 프로덕션 초기 데이터
-- ============================================================================
-- 버전: 1.0
-- 생성일: 2025-01-13
-- 설명: 프로덕션 환경을 위한 필수 초기 데이터만 포함
-- ============================================================================

-- 관리자 계정 생성 (Supabase Auth에서 먼저 생성 후 실행)
-- 이메일: admin@obdoc.com
-- 비밀번호: admin123!@#

-- 관리자 사용자 정보 (UUID는 실제 생성된 값으로 교체 필요)
INSERT INTO users (id, email, role, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@obdoc.com', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 테스트용 의사 계정 (개발/테스트 목적)
INSERT INTO users (id, email, role, is_active) VALUES 
('00000000-0000-0000-0000-000000000002', 'doctor@obdoc.com', 'doctor', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 테스트용 의사 프로필
INSERT INTO doctors (id, user_id, hospital_name, hospital_type, subscription_status, is_approved) VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '테스트 병원', 'clinic', 'active', true)
ON CONFLICT (user_id) DO UPDATE SET
  hospital_name = EXCLUDED.hospital_name,
  hospital_type = EXCLUDED.hospital_type,
  subscription_status = EXCLUDED.subscription_status,
  is_approved = EXCLUDED.is_approved;

-- 기본 병원 코드 생성 (테스트용)
INSERT INTO hospital_codes (code, doctor_id, is_active) VALUES 
('TEST01', '00000000-0000-0000-0000-000000000002', true)
ON CONFLICT (code) DO UPDATE SET
  doctor_id = EXCLUDED.doctor_id,
  is_active = EXCLUDED.is_active;

-- 기본 카테고리 데이터 (커뮤니티용)
-- 이미 enum으로 정의되어 있으므로 별도 테이블 불필요

-- 시스템 설정 (필요시)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 시스템 설정
INSERT INTO system_settings (key, value, description) VALUES 
('app_version', '"1.0.0"', '애플리케이션 버전'),
('maintenance_mode', 'false', '유지보수 모드 활성화 여부'),
('max_file_size', '10485760', '최대 파일 업로드 크기 (10MB)'),
('allowed_file_types', '["jpg", "jpeg", "png", "pdf"]', '허용된 파일 확장자')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_name ON doctors(hospital_name);
CREATE INDEX IF NOT EXISTS idx_doctors_subscription_status ON doctors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_doctor_id ON customers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_weight_records_customer_id ON weight_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_date ON weight_records(record_date);

-- 통계 업데이트 (PostgreSQL 성능 최적화)
ANALYZE users;
ANALYZE doctors;
ANALYZE customers;
ANALYZE appointments;
ANALYZE posts;
ANALYZE comments;
ANALYZE weight_records;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '프로덕션 초기 데이터 설정이 완료되었습니다.';
  RAISE NOTICE '관리자 계정: admin@obdoc.com';
  RAISE NOTICE '테스트 의사 계정: doctor@obdoc.com';
  RAISE NOTICE '테스트 병원 코드: TEST01';
END $$;