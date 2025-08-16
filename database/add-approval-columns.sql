-- subscriptions 테이블에 승인 관련 컬럼 추가
-- 이 스크립트는 Supabase SQL Editor에서 실행해야 합니다.

-- 승인 관련 컬럼 추가
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_subscriptions_approved_by ON subscriptions(approved_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_approved_at ON subscriptions(approved_at);

-- 확인 메시지
SELECT 'subscriptions 테이블 승인 컬럼 추가 완료!' as message;