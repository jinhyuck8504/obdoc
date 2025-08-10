-- ObDoc Challenge System Sample Data
-- 4가지 기본 챌린지 타입 데이터

-- 기본 챌린지 데이터 삽입
INSERT INTO challenges (name, type, description, duration_days, requires_doctor_approval, difficulty_level, target_metrics) VALUES
(
  '물 2L 마시기 챌린지',
  'water_intake',
  '하루에 물 2L(8잔)를 마시는 건강한 수분 섭취 습관을 만들어보세요. 8단계로 나누어 250ml씩 마시면 쉽게 달성할 수 있습니다.',
  30,
  false,
  'easy',
  '{"daily_target": 2000, "unit": "ml", "intervals": 8, "interval_amount": 250}'
),
(
  '컬러풀 챌린지',
  'colorful_diet',
  '매일 5가지 색깔의 채소와 과일을 섭취하여 다양한 영양소를 균형있게 섭취하는 습관을 만들어보세요. 빨강, 노랑, 초록, 보라, 흰색 식품을 골고루 드세요.',
  30,
  false,
  'medium',
  '{"daily_colors": 5, "colors": ["red", "yellow", "green", "purple", "white"], "bonus_rainbow": true}'
),
(
  'DII 기반 식습관 분석 챌린지',
  'dii_analysis',
  'AI 기반 DII(Dietary Inflammatory Index) 분석을 통해 염증 수치를 낮추는 식습관을 만들어보세요. 매일 식사를 기록하면 개인화된 영양 피드백을 받을 수 있습니다.',
  30,
  true,
  'hard',
  '{"target_dii": -2.0, "daily_meals": 3, "ai_analysis": true, "personalized_feedback": true}'
),
(
  '간헐적 단식 챌린지',
  'intermittent_fasting',
  '16:8 간헐적 단식을 통해 건강한 식습관과 체중 관리를 실천해보세요. 의사의 승인이 필요하며, 매일 컨디션을 체크합니다.',
  30,
  true,
  'hard',
  '{"fasting_hours": 16, "eating_window": 8, "daily_condition_check": true, "risk_monitoring": true}'
);

-- 샘플 고객 챌린지 참여 데이터 (테스트용)
-- 실제 운영에서는 이 부분은 제거하고 사용자가 직접 참여하도록 함
/*
INSERT INTO customer_challenges (customer_id, challenge_id, doctor_id, status, start_date, end_date, target_value, health_checklist) VALUES
(
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM challenges WHERE type = 'water_intake' LIMIT 1),
  (SELECT id FROM doctors LIMIT 1),
  'approved',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  2000,
  '{"age": 30, "weight": 70, "height": 170, "medical_conditions": [], "medications": [], "allergies": [], "exercise_level": "medium", "dietary_restrictions": [], "previous_experience": false}'
);
*/