-- ObDoc Challenge System RLS (Row Level Security) Policies
-- 의사-고객 관계 기반 데이터 접근 제어

-- Enable RLS on challenge tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_notifications ENABLE ROW LEVEL SECURITY;

-- Challenges table policies (모든 사용자가 활성 챌린지 조회 가능)
CREATE POLICY "Anyone can view active challenges" ON challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage challenges" ON challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Customer challenges policies (의사는 자신의 고객만, 고객은 자신의 것만)
CREATE POLICY "Customers can view their own challenges" ON customer_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = customer_challenges.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their customers' challenges" ON customer_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = customer_challenges.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create their own challenges" ON customer_challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = customer_challenges.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their customers' challenges" ON customer_challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = customer_challenges.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

-- Challenge daily records policies
CREATE POLICY "Customers can manage their own daily records" ON challenge_daily_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customer_challenges cc
      JOIN customers c ON c.id = cc.customer_id
      WHERE cc.id = challenge_daily_records.customer_challenge_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their customers' daily records" ON challenge_daily_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customer_challenges cc
      JOIN doctors d ON d.id = cc.doctor_id
      WHERE cc.id = challenge_daily_records.customer_challenge_id
      AND d.user_id = auth.uid()
    )
  );

-- AI analysis logs policies (의료진과 해당 고객만 접근)
CREATE POLICY "Customers can view their own AI analysis" ON ai_analysis_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = ai_analysis_logs.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their customers' AI analysis" ON ai_analysis_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN doctors d ON d.id = c.doctor_id
      WHERE c.id = ai_analysis_logs.customer_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create AI analysis logs" ON ai_analysis_logs
  FOR INSERT WITH CHECK (true); -- 시스템에서 생성

-- Challenge notifications policies
CREATE POLICY "Users can view their own notifications" ON challenge_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON challenge_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications" ON challenge_notifications
  FOR INSERT WITH CHECK (true); -- 시스템에서 생성