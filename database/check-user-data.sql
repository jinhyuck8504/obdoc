-- 사용자 데이터 확인 SQL

-- 1. 인증 사용자 목록 확인
SELECT 
  '=== AUTH USERS ===' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. doctors 테이블 확인
SELECT 
  '=== DOCTORS TABLE ===' as info,
  id,
  user_id,
  hospital_name,
  created_at
FROM doctors
ORDER BY created_at DESC;

-- 3. customers 테이블 확인
SELECT 
  '=== CUSTOMERS TABLE ===' as info,
  id,
  user_id,
  name,
  created_at
FROM customers
ORDER BY created_at DESC;

-- 4. 특정 이메일 사용자 확인
SELECT 
  '=== SPECIFIC USERS ===' as info,
  au.id as auth_id,
  au.email,
  d.hospital_name as doctor_name,
  c.name as customer_name,
  CASE 
    WHEN d.id IS NOT NULL THEN 'doctor'
    WHEN c.id IS NOT NULL THEN 'customer'
    ELSE 'no_profile'
  END as detected_role
FROM auth.users au
LEFT JOIN doctors d ON au.id = d.user_id
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email IN ('jinhyucks@gmail.com', 'jinhyuck8504@naver.com')
ORDER BY au.email;

-- 5. 모든 사용자의 역할 매핑 확인
SELECT 
  '=== ALL USER ROLES ===' as info,
  au.email,
  CASE 
    WHEN d.id IS NOT NULL THEN 'doctor'
    WHEN c.id IS NOT NULL THEN 'customer'
    ELSE 'no_profile'
  END as role,
  COALESCE(d.hospital_name, c.name, 'No Name') as display_name
FROM auth.users au
LEFT JOIN doctors d ON au.id = d.user_id
LEFT JOIN customers c ON au.id = c.user_id
ORDER BY au.created_at DESC;