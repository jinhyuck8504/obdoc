-- 사용자 데이터 디버깅 SQL

-- 1. auth.users 테이블 확인
SELECT 
  '=== AUTH USERS ===' as section,
  id,
  email,
  created_at
FROM auth.users
WHERE email IN ('jinhyucks@gmail.com', 'jinhyuck8504@naver.com')
ORDER BY email;

-- 2. doctors 테이블 확인
SELECT 
  '=== DOCTORS TABLE ===' as section,
  d.id,
  d.user_id,
  d.hospital_name,
  d.hospital_type,
  d.is_approved,
  au.email
FROM doctors d
LEFT JOIN auth.users au ON d.user_id = au.id
ORDER BY d.created_at DESC;

-- 3. customers 테이블 확인
SELECT 
  '=== CUSTOMERS TABLE ===' as section,
  c.id,
  c.user_id,
  c.name,
  au.email
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
ORDER BY c.created_at DESC;

-- 4. 특정 사용자 ID로 직접 조회
SELECT 
  '=== DIRECT USER LOOKUP ===' as section,
  'jinhyuck8504@naver.com' as email,
  au.id as auth_id,
  d.hospital_name as doctor_hospital,
  c.name as customer_name
FROM auth.users au
LEFT JOIN doctors d ON au.id = d.user_id
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email = 'jinhyuck8504@naver.com';

SELECT 
  '=== DIRECT USER LOOKUP ===' as section,
  'jinhyucks@gmail.com' as email,
  au.id as auth_id,
  d.hospital_name as doctor_hospital,
  c.name as customer_name
FROM auth.users au
LEFT JOIN doctors d ON au.id = d.user_id
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.email = 'jinhyucks@gmail.com';