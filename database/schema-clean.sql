-- ============================================================================
-- OBDOC MVP - 프로덕션 데이터베이스 스키마
-- ============================================================================
-- 버전: 1.0
-- 생성일: 2025-01-11
-- 설명: 의료진-고객 관리 시스템을 위한 깔끔한 데이터베이스 스키마
-- ============================================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. 사용자 관리 테이블
-- ============================================================================

-- 사용자 기본 정보 (Supabase Auth 연동)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'customer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 의사 프로필
CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  hospital_name TEXT NOT NULL,
  hospital_type TEXT NOT NULL CHECK (hospital_type IN ('clinic', 'oriental_clinic', 'hospital')),
  subscription_plan TEXT CHECK (subscription_plan IN ('1month', '6months', '12months')),
  subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired', 'cancelled')),
  subscription_start DATE,
  subscription_end DATE,
  tax_info JSONB DEFAULT '{}',
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객 프로필
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_code TEXT,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  height DECIMAL(5,2),
  initial_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  health_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. 건강 관리 테이블
-- ============================================================================

-- 체중 기록
CREATE TABLE weight_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(4,2),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 예약 관리
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. 커뮤니티 기능 테이블
-- ============================================================================

-- 커뮤니티 게시글
CREATE TABLE community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  anonymous_nickname TEXT NOT NULL,
  is_reported BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커뮤니티 댓글
CREATE TABLE community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous_nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. 병원 코드 시스템
-- ============================================================================

-- 병원 가입 코드
CREATE TABLE hospital_signup_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가입 코드 사용 로그
CREATE TABLE hospital_signup_code_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code_id UUID REFERENCES hospital_signup_codes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. 구독 및 결제 관리
-- ============================================================================

-- 구독 결제 내역
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('1month', '6months', '12months')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. 성능 최적화 인덱스
-- ============================================================================

-- 사용자 테이블 인덱스
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- 의사 테이블 인덱스
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_subscription_status ON doctors(subscription_status);

-- 고객 테이블 인덱스
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_doctor_id ON customers(doctor_id);

-- 체중 기록 인덱스
CREATE INDEX idx_weight_records_customer_id ON weight_records(customer_id);
CREATE INDEX idx_weight_records_recorded_at ON weight_records(recorded_at);

-- 예약 인덱스
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- 커뮤니티 인덱스
CREATE INDEX idx_community_posts_customer_id ON community_posts(customer_id);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);

-- 병원 코드 인덱스
CREATE INDEX idx_hospital_signup_codes_doctor_id ON hospital_signup_codes(doctor_id);
CREATE INDEX idx_hospital_signup_codes_code ON hospital_signup_codes(code);
CREATE INDEX idx_hospital_signup_codes_active ON hospital_signup_codes(is_active);
CREATE INDEX idx_hospital_signup_code_usage_code_id ON hospital_signup_code_usage(code_id);
CREATE INDEX idx_hospital_signup_code_usage_customer_id ON hospital_signup_code_usage(customer_id);

-- 구독 인덱스
CREATE INDEX idx_subscriptions_doctor_id ON subscriptions(doctor_id);

-- ============================================================================
-- 7. 자동 업데이트 트리거
-- ============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at 
    BEFORE UPDATE ON community_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_signup_codes_updated_at 
    BEFORE UPDATE ON hospital_signup_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. 유틸리티 함수
-- ============================================================================

-- 병원 코드 사용 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_code_usage(code_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE hospital_signup_codes 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 스키마 설치 완료
-- ============================================================================
SELECT 'OBDOC MVP 스키마 설치가 완료되었습니다!' as message;