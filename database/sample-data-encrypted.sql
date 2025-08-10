-- Sample data for testing Obdoc MVP with Encryption
-- 이 파일을 schema-encrypted.sql 실행 후에 실행하세요

-- Sample admin user (시스템 관리자)
INSERT INTO users (id, email_encrypted, role, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', encrypt_text('admin@obdoc.co.kr'), 'admin', true);

-- Sample doctor users (원장님들)
INSERT INTO users (id, email_encrypted, phone_encrypted, role, is_active) VALUES 
('11111111-1111-1111-1111-111111111111', encrypt_text('doctor1@hospital.com'), encrypt_text('010-1234-5678'), 'doctor', true),
('22222222-2222-2222-2222-222222222222', encrypt_text('doctor2@clinic.com'), encrypt_text('010-2345-6789'), 'doctor', true);

-- Sample patient users (환자들)
INSERT INTO users (id, phone_encrypted, role, is_active) VALUES 
('33333333-3333-3333-3333-333333333333', encrypt_text('010-3333-3333'), 'patient', true),
('44444444-4444-4444-4444-444444444444', encrypt_text('010-4444-4444'), 'patient', true),
('55555555-5555-5555-5555-555555555555', encrypt_text('010-5555-5555'), 'patient', true);

-- Sample doctors
INSERT INTO doctors (id, user_id, hospital_name_encrypted, hospital_type, subscription_plan, subscription_status, subscription_start, subscription_end, is_approved) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', encrypt_text('서울비만클리닉'), '비만전문병원', '6months', 'active', '2024-01-01', '2024-07-01', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', encrypt_text('강남다이어트의원'), '일반의원', '1month', 'pending', NULL, NULL, false);

-- Sample patients
INSERT INTO patients (id, user_id, doctor_id, name_encrypted, phone_encrypted, health_data_encrypted) VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', encrypt_text('김철수'), encrypt_text('010-3333-3333'), encrypt_text('{"currentWeight": 85, "targetWeight": 70, "height": 175}')),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', encrypt_text('이영희'), encrypt_text('010-4444-4444'), encrypt_text('{"currentWeight": 68, "targetWeight": 55, "height": 160}')),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', encrypt_text('박민수'), encrypt_text('010-5555-5555'), encrypt_text('{"currentWeight": 92, "targetWeight": 80, "height": 180}'));

-- Sample appointments
INSERT INTO appointments (doctor_id, patient_id, appointment_date, status, notes_encrypted) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-01-15 10:00:00+09', 'completed', encrypt_text('초기 상담 완료')),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-01-15 14:00:00+09', 'completed', encrypt_text('체중 측정 및 식단 상담')),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-01-16 11:00:00+09', 'scheduled', encrypt_text('2주차 진료 예정'));

-- Sample community posts (익명이므로 암호화 불필요)
INSERT INTO community_posts (patient_id, title, content, tags, anonymous_nickname) VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', '2주만에 3kg 감량 성공!', '운동과 식단 조절로 목표에 한 걸음 더 가까워졌어요. 모두 화이팅!', ARRAY['성공후기', '운동', '식단'], '다이어트왕'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '식단 관리 팁 공유해요', '단백질 위주 식단으로 바꾸니까 포만감도 좋고 체중도 줄어들어요.', ARRAY['식단팁', '단백질'], '건강미인'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '운동 초보자 추천 루틴', '처음 시작하는 분들을 위한 간단한 홈트레이닝 루틴 소개합니다.', ARRAY['운동', '초보자', '홈트'], '운동러버');

-- Sample community comments (익명이므로 암호화 불필요)
INSERT INTO community_comments (post_id, patient_id, content, anonymous_nickname) VALUES 
((SELECT id FROM community_posts WHERE title = '2주만에 3kg 감량 성공!' LIMIT 1), 'dddddddd-dddd-dddd-dddd-dddddddddddd', '축하해요! 저도 열심히 해볼게요', '건강미인'),
((SELECT id FROM community_posts WHERE title = '2주만에 3kg 감량 성공!' LIMIT 1), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '정말 대단하세요! 어떤 운동 하셨나요?', '운동러버');

-- Sample subscriptions
INSERT INTO subscriptions (doctor_id, plan_type, amount, payment_status, start_date, end_date) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6months', 528000, 'paid', '2024-01-01', '2024-07-01'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1month', 110000, 'pending', NULL, NULL);