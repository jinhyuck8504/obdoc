-- Obdoc MVP Database Schema with Encryption
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- Create encryption key (한 번만 실행)
SELECT pgsodium.create_key('personal_data_key');

-- Users table (Supabase Auth와 연동) - 개인정보 암호화
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email_encrypted BYTEA, -- 암호화된 이메일
  phone_encrypted BYTEA, -- 암호화된 전화번호
  role TEXT NOT NULL CHECK (role IN ('doctor', 'patient', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table - 개인정보 암호화
CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hospital_name_encrypted BYTEA, -- 암호화된 병원명
  hospital_type TEXT NOT NULL,
  subscription_plan TEXT CHECK (subscription_plan IN ('1month', '6months', '12months')),
  subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired', 'cancelled')),
  subscription_start DATE,
  subscription_end DATE,
  tax_info_encrypted BYTEA, -- 암호화된 세금계산서 정보
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table - 개인정보 암호화
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  name_encrypted BYTEA NOT NULL, -- 암호화된 이름
  phone_encrypted BYTEA, -- 암호화된 전화번호
  health_data_encrypted BYTEA DEFAULT pgsodium.crypto_aead_det_encrypt('{}', NULL, (SELECT id FROM pgsodium.key WHERE name = 'personal_data_key')), -- 암호화된 건강 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes_encrypted BYTEA, -- 암호화된 진료 노트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table (익명이므로 개인정보 없음)
CREATE TABLE community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  anonymous_nickname TEXT NOT NULL,
  is_reported BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community comments table (익명이므로 개인정보 없음)
CREATE TABLE community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous_nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (결제 내역 관리)
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('1month', '6months', '12months')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  start_date DATE,
  end_date DATE,
  notes_encrypted BYTEA, -- 암호화된 결제 관련 노트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 암호화/복호화를 위한 헬퍼 함수들
CREATE OR REPLACE FUNCTION encrypt_text(plain_text TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgsodium.crypto_aead_det_encrypt(
    plain_text::BYTEA, 
    NULL, 
    (SELECT id FROM pgsodium.key WHERE name = 'personal_data_key')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_text(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    pgsodium.crypto_aead_det_decrypt(
      encrypted_data, 
      NULL, 
      (SELECT id FROM pgsodium.key WHERE name = 'personal_data_key')
    ), 
    'UTF8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 뷰를 통한 복호화된 데이터 접근 (개발 편의성)
CREATE VIEW users_decrypted AS
SELECT 
  id,
  CASE 
    WHEN email_encrypted IS NOT NULL THEN decrypt_text(email_encrypted)
    ELSE NULL 
  END as email,
  CASE 
    WHEN phone_encrypted IS NOT NULL THEN decrypt_text(phone_encrypted)
    ELSE NULL 
  END as phone,
  role,
  is_active,
  created_at,
  updated_at
FROM users;

CREATE VIEW doctors_decrypted AS
SELECT 
  id,
  user_id,
  CASE 
    WHEN hospital_name_encrypted IS NOT NULL THEN decrypt_text(hospital_name_encrypted)
    ELSE NULL 
  END as hospital_name,
  hospital_type,
  subscription_plan,
  subscription_status,
  subscription_start,
  subscription_end,
  CASE 
    WHEN tax_info_encrypted IS NOT NULL THEN decrypt_text(tax_info_encrypted)::JSONB
    ELSE NULL 
  END as tax_info,
  is_approved,
  created_at,
  updated_at
FROM doctors;

CREATE VIEW patients_decrypted AS
SELECT 
  id,
  user_id,
  doctor_id,
  decrypt_text(name_encrypted) as name,
  CASE 
    WHEN phone_encrypted IS NOT NULL THEN decrypt_text(phone_encrypted)
    ELSE NULL 
  END as phone,
  CASE 
    WHEN health_data_encrypted IS NOT NULL THEN decrypt_text(health_data_encrypted)::JSONB
    ELSE '{}'::JSONB 
  END as health_data,
  created_at,
  updated_at
FROM patients;

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_subscription_status ON doctors(subscription_status);
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_community_posts_patient_id ON community_posts(patient_id);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_subscriptions_doctor_id ON subscriptions(doctor_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();