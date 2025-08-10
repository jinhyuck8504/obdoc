-- 사용자 프로필 수동 생성 SQL (실제 스키마에 맞춤)

-- 1. 먼저 현재 auth 사용자 ID 확인
SELECT 
  '=== CURRENT AUTH USERS ===' as info,
  id,
  email,
  created_at
FROM auth.users
WHERE email IN ('jinhyucks@gmail.com', 'jinhyuck8504@naver.com')
ORDER BY email;

-- 2. jinhyucks@gmail.com은 관리자로 설정 (슈퍼 관리자 로직에 의해 처리됨)
-- 별도 테이블 생성 불필요 - 코드에서 isSuperAdmin() 함수로 처리

-- 3. jinhyuck8504@naver.com을 의사로 설정 (테스트의원)
DO $$
DECLARE
    doctor_user_id UUID;
BEGIN
    -- 사용자 ID 가져오기
    SELECT id INTO doctor_user_id 
    FROM auth.users 
    WHERE email = 'jinhyuck8504@naver.com';
    
    IF doctor_user_id IS NOT NULL THEN
        -- 기존 doctor 프로필이 있다면 삭제
        DELETE FROM doctors WHERE user_id = doctor_user_id;
        
        -- 새로운 doctor 프로필 생성 (실제 스키마에 맞춤)
        INSERT INTO doctors (
            user_id,
            hospital_name,
            hospital_type,
            subscription_plan,
            subscription_status,
            subscription_start,
            subscription_end,
            is_approved,
            created_at,
            updated_at
        ) VALUES (
            doctor_user_id,
            '테스트의원',
            'clinic',
            '1month',
            'active',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Doctor profile created for: jinhyuck8504@naver.com (테스트의원)';
    ELSE
        RAISE NOTICE 'User not found: jinhyuck8504@naver.com';
    END IF;
END $$;

-- 4. 결과 확인
SELECT 
  '=== FINAL VERIFICATION ===' as info,
  au.email,
  CASE 
    WHEN au.email = 'jinhyucks@gmail.com' THEN 'admin (슈퍼 관리자)'
    WHEN d.id IS NOT NULL THEN 'doctor'
    WHEN c.id IS NOT NULL THEN 'customer'
    ELSE 'no_profile'
  END as role,
  CASE 
    WHEN au.email = 'jinhyucks@gmail.com' THEN '관리자 (코드에서 처리)'
    ELSE COALESCE(d.hospital_name, c.name, 'No Name')
  END as display_name,
  au.id as auth_id,
  d.id as doctor_id,
  c.id as customer_id
FROM auth.users au
LEFT JOIN doctors d ON au.id = d.user_id
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email IN ('jinhyucks@gmail.com', 'jinhyuck8504@naver.com')
ORDER BY au.email;