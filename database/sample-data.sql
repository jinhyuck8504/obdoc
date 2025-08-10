-- Sample data for testing Obdoc MVP
-- 이 파일을 schema.sql과 rls-policies.sql 실행 후에 실행하세요

-- Sample admin user (시스템 관리자)
INSERT INTO users (id, email, role, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@obdoc.co.kr', 'admin', true);

-- Sample doctor users (원장님들)
INSERT INTO users (id, email, phone, role, is_active) VALUES 
('11111111-1111-1111-1111-111111111111', 'doctor1@hospital.com', '010-1234-5678', 'doctor', true),
('22222222-2222-2222-2222-222222222222', 'doctor2@clinic.com', '010-2345-6789', 'doctor', true);

-- Sample customer users (고객들)
INSERT INTO users (id, email, phone, role, is_active) VALUES 
('33333333-3333-3333-3333-333333333333', NULL, '010-3333-3333', 'customer', true),
('44444444-4444-4444-4444-444444444444', NULL, '010-4444-4444', 'customer', true),
('55555555-5555-5555-5555-555555555555', NULL, '010-5555-5555', 'customer', true);

-- Sample doctors
INSERT INTO doctors (id, user_id, hospital_name, hospital_type, subscription_plan, subscription_status, subscription_start, subscription_end, is_approved) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '서울비만클리닉', 'clinic', '6months', 'active', '2024-01-01', '2024-07-01', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '강남한의원', 'oriental_clinic', '1month', 'pending', NULL, NULL, false);

-- Sample customers
INSERT INTO customers (id, user_id, doctor_id, name, birth_date, gender, height, initial_weight, target_weight, health_data) VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '김철수', '1985-03-15', 'male', 175.0, 90.0, 70.0, '{"allergies": [], "medications": []}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '이영희', '1990-07-22', 'female', 160.0, 75.0, 55.0, '{"allergies": ["새우"], "medications": []}'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '박민수', '1988-11-08', 'male', 180.0, 95.0, 80.0, '{"allergies": [], "medications": ["혈압약"]}');

-- Sample weight records
INSERT INTO weight_records (customer_id, weight, bmi, notes, recorded_at) VALUES 
-- 김철수 체중 기록
('cccccccc-cccc-cccc-cccc-cccccccccccc', 90.0, 29.4, '초기 체중', '2024-01-01 09:00:00+09'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 88.5, 28.9, '1주차', '2024-01-08 09:00:00+09'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 87.0, 28.4, '2주차', '2024-01-15 09:00:00+09'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 85.5, 27.9, '3주차', '2024-01-22 09:00:00+09'),

-- 이영희 체중 기록
('dddddddd-dddd-dddd-dddd-dddddddddddd', 75.0, 29.3, '초기 체중', '2024-01-01 10:00:00+09'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 73.5, 28.7, '1주차', '2024-01-08 10:00:00+09'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 72.0, 28.1, '2주차', '2024-01-15 10:00:00+09'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 70.8, 27.7, '3주차', '2024-01-22 10:00:00+09'),

-- 박민수 체중 기록
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 95.0, 29.3, '초기 체중', '2024-01-01 11:00:00+09'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 93.8, 29.0, '1주차', '2024-01-08 11:00:00+09'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 92.5, 28.6, '2주차', '2024-01-15 11:00:00+09');

-- Sample appointments
INSERT INTO appointments (doctor_id, customer_id, appointment_date, status, notes) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-01-15 10:00:00+09', 'completed', '초기 상담 완료'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-01-15 14:00:00+09', 'completed', '체중 측정 및 식단 상담'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-01-16 11:00:00+09', 'scheduled', '2주차 진료 예정');

-- Sample community posts
INSERT INTO community_posts (customer_id, title, content, tags, anonymous_nickname) VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', '2주만에 3kg 감량 성공!', '운동과 식단 조절로 목표에 한 걸음 더 가까워졌어요. 모두 화이팅!', ARRAY['성공후기', '운동', '식단'], '다이어트왕'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '식단 관리 팁 공유해요', '단백질 위주 식단으로 바꾸니까 포만감도 좋고 체중도 줄어들어요.', ARRAY['식단팁', '단백질'], '건강미인'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '운동 초보자 추천 루틴', '처음 시작하는 분들을 위한 간단한 홈트레이닝 루틴 소개합니다.', ARRAY['운동', '초보자', '홈트'], '운동러버');

-- Sample community comments
INSERT INTO community_comments (post_id, customer_id, content, anonymous_nickname) VALUES 
((SELECT id FROM community_posts WHERE title = '2주만에 3kg 감량 성공!' LIMIT 1), 'dddddddd-dddd-dddd-dddd-dddddddddddd', '축하해요! 저도 열심히 해볼게요', '건강미인'),
((SELECT id FROM community_posts WHERE title = '2주만에 3kg 감량 성공!' LIMIT 1), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '정말 대단하세요! 어떤 운동 하셨나요?', '운동러버');

-- Sample subscriptions
INSERT INTO subscriptions (doctor_id, plan_type, amount, payment_status, start_date, end_date) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6months', 528000, 'paid', '2024-01-01', '2024-07-01'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1month', 110000, 'pending', NULL, NULL);