-- ========================================
-- OBDOC MVP 관리자 대시보드 긴급 스키마 수정
-- 실행일: 2025-01-08
-- 목적: 정식 서비스 배포 전 400/404 에러 해결
-- ========================================

-- 1. subscriptions 테이블 plan 컬럼 추가 (기존 plan_type과 호환성 유지)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;

-- 2. 기존 데이터 동기화 (plan_type → plan)
UPDATE subscriptions SET plan = plan_type WHERE plan IS NULL;

-- 3. reports 테이블 생성 (모더레이션 기능용)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_content_id UUID,
  content_type TEXT CHECK (content_type IN ('post', 'comment', 'user')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. reports 테이블 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);

-- 5. reports 테이블 RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책: 관리자만 모든 신고 조회/관리 가능
CREATE POLICY "Admins can manage all reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 7. 일반 사용자는 자신이 신고한 내용만 조회 가능
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 8. 샘플 구독 데이터 삽입 (테스트용 - 실제 의사 계정 기반)
INSERT INTO subscriptions (doctor_id, plan_type, plan, status, payment_status, amount, start_date, end_date, created_at) 
SELECT 
  doctors.id as doctor_id,
  '1month' as plan_type,
  '1month' as plan,
  'active' as status,
  'paid' as payment_status,
  199000 as amount,
  CURRENT_DATE - INTERVAL '15 days' as start_date,
  CURRENT_DATE + INTERVAL '15 days' as end_date,
  CURRENT_DATE - INTERVAL '15 days' as created_at
FROM doctors 
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = doctors.user_id AND users.role = 'doctor')
LIMIT 2
ON CONFLICT DO NOTHING;

-- 9. 6개월 플랜 샘플 데이터
INSERT INTO subscriptions (doctor_id, plan_type, plan, status, payment_status, amount, start_date, end_date, created_at) 
SELECT 
  doctors.id as doctor_id,
  '6month' as plan_type,
  '6month' as plan,
  'active' as status,
  'paid' as payment_status,
  999000 as amount,
  CURRENT_DATE - INTERVAL '30 days' as start_date,
  CURRENT_DATE + INTERVAL '150 days' as end_date,
  CURRENT_DATE - INTERVAL '30 days' as created_at
FROM doctors 
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = doctors.user_id AND users.role = 'doctor')
LIMIT 1
ON CONFLICT DO NOTHING;

-- 10. 샘플 신고 데이터 삽입 (테스트용)
INSERT INTO reports (reporter_id, reported_user_id, content_type, reason, description, status, created_at)
SELECT 
  u1.id as reporter_id,
  u2.id as reported_user_id,
  'user' as content_type,
  '부적절한 프로필 정보' as reason,
  '의사 자격증 정보가 부정확해 보입니다.' as description,
  'pending' as status,
  CURRENT_DATE - INTERVAL '2 days' as created_at
FROM users u1, users u2 
WHERE u1.id != u2.id 
  AND u1.role = 'customer' 
  AND u2.role = 'doctor'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 11. 처리된 신고 샘플 데이터
INSERT INTO reports (reporter_id, reported_user_id, content_type, reason, description, status, admin_notes, resolved_by, resolved_at, created_at)
SELECT 
  u1.id as reporter_id,
  u2.id as reported_user_id,
  'user' as content_type,
  '스팸 메시지' as reason,
  '반복적인 광고성 메시지를 보냅니다.' as description,
  'resolved' as status,
  '경고 조치 완료' as admin_notes,
  admin.id as resolved_by,
  CURRENT_DATE - INTERVAL '1 day' as resolved_at,
  CURRENT_DATE - INTERVAL '3 days' as created_at
FROM users u1, users u2, users admin
WHERE u1.id != u2.id 
  AND u1.role = 'customer' 
  AND u2.role = 'doctor'
  AND admin.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 12. 데이터 확인 쿼리
SELECT 'subscriptions' as table_name, COUNT(*) as count FROM subscriptions
UNION ALL
SELECT 'reports' as table_name, COUNT(*) as count FROM reports
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors;

-- 13. 구독 플랜별 분포 확인
SELECT plan_type, plan, status, COUNT(*) as count 
FROM subscriptions 
GROUP BY plan_type, plan, status 
ORDER BY plan_type, status;

-- 14. 신고 상태별 분포 확인
SELECT status, COUNT(*) as count 
FROM reports 
GROUP BY status 
ORDER BY status;

-- ========================================
-- 실행 완료 후 예상 결과:
-- - subscriptions: 3개 이상의 레코드
-- - reports: 2개 이상의 레코드
-- - 400/404 에러 해결
-- ========================================