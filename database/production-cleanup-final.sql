-- =====================================================
-- 정식 서비스 오픈을 위한 완전한 데이터 정리 스크립트
-- 실행 전 반드시 데이터베이스 백업을 수행하세요!
-- =====================================================

-- 시작 메시지
SELECT '🚀 정식 서비스 오픈을 위한 데이터 정리를 시작합니다...' as status;

-- =====================================================
-- 1단계: 현재 데이터 상태 확인
-- =====================================================
SELECT '📊 현재 데이터 상태를 확인합니다...' as status;

SELECT 
  'users' as table_name, 
  COUNT(*) as current_count,
  COUNT(CASE WHEN email = 'jinhyucks@gmail.com' THEN 1 END) as admin_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name, 
  COUNT(*) as current_count,
  COUNT(CASE WHEN email = 'jinhyucks@gmail.com' THEN 1 END) as admin_count
FROM public.users
UNION ALL
SELECT 'doctors', COUNT(*), 0 FROM public.doctors
UNION ALL
SELECT 'patients', COUNT(*), 0 FROM public.patients
UNION ALL
SELECT 'customers', COUNT(*), 0 FROM public.customers
UNION ALL
SELECT 'appointments', COUNT(*), 0 FROM public.appointments
UNION ALL
SELECT 'subscriptions', COUNT(*), 0 FROM public.subscriptions
UNION ALL
SELECT 'community_posts', COUNT(*), 0 FROM public.community_posts
UNION ALL
SELECT 'community_comments', COUNT(*), 0 FROM public.community_comments
UNION ALL
SELECT 'hospital_codes', COUNT(*), 0 FROM public.hospital_codes
UNION ALL
SELECT 'challenges', COUNT(*), 0 FROM public.challenges
UNION ALL
SELECT 'challenge_participants', COUNT(*), 0 FROM public.challenge_participants
UNION ALL
SELECT 'health_records', COUNT(*), 0 FROM public.health_records
UNION ALL
SELECT 'weight_records', COUNT(*), 0 FROM public.weight_records
UNION ALL
SELECT 'tax_invoices', COUNT(*), 0 FROM public.tax_invoices;

-- =====================================================
-- 2단계: 관리자 계정 보존 확인
-- =====================================================
SELECT '🔒 관리자 계정 보존을 확인합니다...' as status;

-- 관리자 계정이 존재하는지 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'jinhyucks@gmail.com'
  ) THEN
    RAISE EXCEPTION '❌ 관리자 계정(jinhyucks@gmail.com)이 존재하지 않습니다. 정리를 중단합니다.';
  END IF;
  
  RAISE NOTICE '✅ 관리자 계정이 확인되었습니다.';
END $$;

-- =====================================================
-- 3단계: 외래 키 제약 조건 임시 비활성화
-- =====================================================
SELECT '🔧 외래 키 제약 조건을 임시 비활성화합니다...' as status;

SET session_replication_role = replica;

-- =====================================================
-- 4단계: 비즈니스 데이터 삭제 (의존성 순서 고려)
-- =====================================================
SELECT '🗑️ 비즈니스 데이터를 삭제합니다...' as status;

-- 4-1. 세금계산서 데이터 삭제
DELETE FROM public.tax_invoices;
SELECT '✅ 세금계산서 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 4-2. 구독 데이터 삭제
DELETE FROM public.subscriptions;
SELECT '✅ 구독 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 5단계: 건강 관련 데이터 삭제
-- =====================================================
SELECT '💊 건강 관련 데이터를 삭제합니다...' as status;

-- 5-1. 체중 기록 삭제
DELETE FROM public.weight_records;
SELECT '✅ 체중 기록 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 5-2. 건강 기록 삭제
DELETE FROM public.health_records;
SELECT '✅ 건강 기록 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 6단계: 챌린지 데이터 삭제
-- =====================================================
SELECT '🏆 챌린지 데이터를 삭제합니다...' as status;

-- 6-1. 챌린지 참가자 삭제
DELETE FROM public.challenge_participants;
SELECT '✅ 챌린지 참가자 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 6-2. 챌린지 삭제
DELETE FROM public.challenges;
SELECT '✅ 챌린지 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 7단계: 커뮤니티 데이터 삭제
-- =====================================================
SELECT '💬 커뮤니티 데이터를 삭제합니다...' as status;

-- 7-1. 커뮤니티 댓글 삭제
DELETE FROM public.community_comments;
SELECT '✅ 커뮤니티 댓글 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 7-2. 커뮤니티 게시글 삭제
DELETE FROM public.community_posts;
SELECT '✅ 커뮤니티 게시글 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 8단계: 예약 데이터 삭제
-- =====================================================
SELECT '📅 예약 데이터를 삭제합니다...' as status;

-- 8-1. 모든 예약 삭제
DELETE FROM public.appointments;
SELECT '✅ 예약 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 9단계: 병원 코드 데이터 삭제
-- =====================================================
SELECT '🏥 병원 코드 데이터를 삭제합니다...' as status;

-- 9-1. 모든 병원 코드 삭제
DELETE FROM public.hospital_codes;
SELECT '✅ 병원 코드 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 10단계: 사용자 관련 데이터 삭제
-- =====================================================
SELECT '👥 사용자 관련 데이터를 삭제합니다...' as status;

-- 10-1. 환자 데이터 삭제
DELETE FROM public.patients;
SELECT '✅ 환자 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 10-2. 고객 데이터 삭제
DELETE FROM public.customers;
SELECT '✅ 고객 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 10-3. 의사 데이터 삭제
DELETE FROM public.doctors;
SELECT '✅ 의사 데이터 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 10-4. 관리자 제외 public.users 삭제
DELETE FROM public.users 
WHERE email != 'jinhyucks@gmail.com';
SELECT '✅ 일반 사용자 프로필 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- 10-5. 관리자 제외 auth.users 삭제
DELETE FROM auth.users 
WHERE email != 'jinhyucks@gmail.com';
SELECT '✅ 일반 사용자 계정 삭제 완료: ' || ROW_COUNT() || '건' as status;

-- =====================================================
-- 11단계: 시퀀스 리셋 (ID를 1부터 다시 시작)
-- =====================================================
SELECT '🔄 시퀀스를 리셋합니다...' as status;

-- 시퀀스 리셋 (존재하는 시퀀스만)
DO $$
DECLARE
    seq_name TEXT;
    seq_list TEXT[] := ARRAY[
        'users_id_seq',
        'doctors_id_seq', 
        'patients_id_seq',
        'customers_id_seq',
        'appointments_id_seq',
        'subscriptions_id_seq',
        'community_posts_id_seq',
        'community_comments_id_seq',
        'hospital_codes_id_seq',
        'challenges_id_seq',
        'challenge_participants_id_seq',
        'health_records_id_seq',
        'weight_records_id_seq',
        'tax_invoices_id_seq'
    ];
BEGIN
    FOREACH seq_name IN ARRAY seq_list
    LOOP
        BEGIN
            EXECUTE 'ALTER SEQUENCE public.' || seq_name || ' RESTART WITH 1';
            RAISE NOTICE '✅ 시퀀스 리셋 완료: %', seq_name;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE '⚠️ 시퀀스가 존재하지 않음: %', seq_name;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 12단계: 관리자 계정 정보 업데이트
-- =====================================================
SELECT '👑 관리자 계정 정보를 업데이트합니다...' as status;

-- public.users 테이블의 관리자 정보 업데이트
INSERT INTO public.users (email, role, full_name, created_at, updated_at)
VALUES ('jinhyucks@gmail.com', 'admin', '진혁 (관리자)', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = '진혁 (관리자)',
  updated_at = NOW();

SELECT '✅ 관리자 계정 정보 업데이트 완료' as status;

-- =====================================================
-- 13단계: 외래 키 제약 조건 재활성화
-- =====================================================
SELECT '🔧 외래 키 제약 조건을 재활성화합니다...' as status;

SET session_replication_role = DEFAULT;

-- =====================================================
-- 14단계: 정리 결과 확인
-- =====================================================
SELECT '📊 정리 결과를 확인합니다...' as status;

SELECT 
  'users' as table_name, 
  COUNT(*) as remaining_count,
  COUNT(CASE WHEN email = 'jinhyucks@gmail.com' THEN 1 END) as admin_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name, 
  COUNT(*) as remaining_count,
  COUNT(CASE WHEN email = 'jinhyucks@gmail.com' THEN 1 END) as admin_count
FROM public.users
UNION ALL
SELECT 'doctors', COUNT(*), 0 FROM public.doctors
UNION ALL
SELECT 'patients', COUNT(*), 0 FROM public.patients
UNION ALL
SELECT 'customers', COUNT(*), 0 FROM public.customers
UNION ALL
SELECT 'appointments', COUNT(*), 0 FROM public.appointments
UNION ALL
SELECT 'subscriptions', COUNT(*), 0 FROM public.subscriptions
UNION ALL
SELECT 'community_posts', COUNT(*), 0 FROM public.community_posts
UNION ALL
SELECT 'community_comments', COUNT(*), 0 FROM public.community_comments
UNION ALL
SELECT 'hospital_codes', COUNT(*), 0 FROM public.hospital_codes
UNION ALL
SELECT 'challenges', COUNT(*), 0 FROM public.challenges
UNION ALL
SELECT 'challenge_participants', COUNT(*), 0 FROM public.challenge_participants
UNION ALL
SELECT 'health_records', COUNT(*), 0 FROM public.health_records
UNION ALL
SELECT 'weight_records', COUNT(*), 0 FROM public.weight_records
UNION ALL
SELECT 'tax_invoices', COUNT(*), 0 FROM public.tax_invoices;

-- =====================================================
-- 15단계: 완료 메시지
-- =====================================================
SELECT '🎉 정식 서비스 오픈을 위한 데이터 정리가 완료되었습니다!' as status;
SELECT '✅ 관리자 계정(jinhyucks@gmail.com)만 보존되었습니다.' as status;
SELECT '✅ 모든 더미 데이터가 삭제되었습니다.' as status;
SELECT '✅ 시퀀스가 1부터 다시 시작됩니다.' as status;
SELECT '🚀 이제 실제 사용자들이 가입할 수 있습니다!' as status;

-- =====================================================
-- 실행 가이드
-- =====================================================
/*
🔥 실행 방법:
1. Supabase 대시보드 → SQL Editor 접속
2. 이 스크립트 전체를 복사하여 붙여넣기
3. "Run" 버튼 클릭하여 실행
4. 결과 확인 후 애플리케이션 테스트

⚠️ 주의사항:
- 실행 전 반드시 데이터베이스 백업 수행
- 관리자 계정(jinhyucks@gmail.com)이 존재하는지 확인
- 프로덕션 환경에서만 실행
- 실행 후 되돌릴 수 없음

✅ 실행 후 확인사항:
- 관리자 계정으로 로그인 가능한지 확인
- 새로운 사용자 가입이 정상 작동하는지 확인
- 모든 대시보드가 빈 상태로 표시되는지 확인
*/