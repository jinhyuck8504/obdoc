-- ObDoc Challenge System Database Schema
-- 기존 ObDoc 시스템에 추가되는 챌린지 관련 테이블들

-- Enable UUID extension (이미 존재하지만 안전하게 추가)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 챌린지 정의 테이블
CREATE TABLE challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('water_intake', 'colorful_diet', 'dii_analysis', 'intermittent_fasting')),
  description TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  requires_doctor_approval BOOLEAN DEFAULT false,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  target_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객-챌린지 참여 테이블
CREATE TABLE customer_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'failed')),
  start_date DATE,
  end_date DATE,
  target_value DECIMAL(10,2),
  current_progress DECIMAL(10,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  health_checklist JSONB DEFAULT '{}',
  doctor_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, challenge_id)
);

-- 일일 챌린지 기록 테이블
CREATE TABLE challenge_daily_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_challenge_id UUID REFERENCES customer_challenges(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('water_intake', 'food_log', 'color_checklist', 'fasting_status')),
  record_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB DEFAULT '{}',
  progress_value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_challenge_id, record_date, record_type)
);

-- AI 분석 로그 테이블
CREATE TABLE ai_analysis_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'google')),
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('food_recognition', 'dii_calculation', 'health_assessment', 'risk_detection')),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time_ms INTEGER,
  cost_usd DECIMAL(10,6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 챌린지 알림 테이블
CREATE TABLE challenge_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'doctor')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('approval_request', 'risk_alert', 'progress_update', 'completion', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_challenge_id UUID REFERENCES customer_challenges(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_active ON challenges(is_active);
CREATE INDEX idx_customer_challenges_customer_id ON customer_challenges(customer_id);
CREATE INDEX idx_customer_challenges_doctor_id ON customer_challenges(doctor_id);
CREATE INDEX idx_customer_challenges_status ON customer_challenges(status);
CREATE INDEX idx_customer_challenges_dates ON customer_challenges(start_date, end_date);
CREATE INDEX idx_challenge_daily_records_customer_challenge_id ON challenge_daily_records(customer_challenge_id);
CREATE INDEX idx_challenge_daily_records_date ON challenge_daily_records(record_date);
CREATE INDEX idx_challenge_daily_records_type ON challenge_daily_records(record_type);
CREATE INDEX idx_ai_analysis_logs_customer_id ON ai_analysis_logs(customer_id);
CREATE INDEX idx_ai_analysis_logs_provider ON ai_analysis_logs(provider);
CREATE INDEX idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);
CREATE INDEX idx_challenge_notifications_recipient ON challenge_notifications(recipient_id, is_read);
CREATE INDEX idx_challenge_notifications_type ON challenge_notifications(notification_type);

-- Updated at trigger function 적용
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_challenges_updated_at BEFORE UPDATE ON customer_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();