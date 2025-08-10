-- 🚨 RLS 완전 제거 및 406 오류 해결 SQL
-- 모든 테이블의 RLS를 완전히 비활성화하고 모든 정책을 강제 삭제

-- 1단계: 모든 테이블의 RLS 강제 비활성화
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- 모든 테이블에서 RLS 비활성화
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE IF EXISTS ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS disabled for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to disable RLS for table: %, Error: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2단계: 모든 정책 강제 삭제
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- 모든 정책 삭제
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
            RAISE NOTICE 'Policy dropped: % on table %', policy_record.policyname, policy_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to drop policy: % on table %, Error: %', policy_record.policyname, policy_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3단계: 특정 테이블들 추가 확인 및 처리
DO $$
DECLARE
    target_tables TEXT[] := ARRAY['doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY target_tables
    LOOP
        -- RLS 비활성화
        BEGIN
            EXECUTE 'ALTER TABLE IF EXISTS ' || table_name || ' DISABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS disabled for critical table: %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Table % may not exist or already processed', table_name;
        END;
        
        -- 모든 정책 삭제
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Enable update for users based on user_id" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Users can view own data" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Users can insert own data" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Users can update own data" ON ' || table_name;
            EXECUTE 'DROP POLICY IF EXISTS "Users can delete own data" ON ' || table_name;
            RAISE NOTICE 'Common policies dropped for table: %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Some policies may not exist for table: %', table_name;
        END;
    END LOOP;
END $$;

-- 4단계: 권한 재설정 (모든 사용자에게 모든 권한 부여)
DO $$
DECLARE
    target_tables TEXT[] := ARRAY['doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY target_tables
    LOOP
        BEGIN
            -- anon 사용자에게 모든 권한 부여
            EXECUTE 'GRANT ALL ON TABLE ' || table_name || ' TO anon';
            -- authenticated 사용자에게 모든 권한 부여
            EXECUTE 'GRANT ALL ON TABLE ' || table_name || ' TO authenticated';
            -- service_role에게 모든 권한 부여
            EXECUTE 'GRANT ALL ON TABLE ' || table_name || ' TO service_role';
            RAISE NOTICE 'Permissions granted for table: %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to grant permissions for table: %, Error: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5단계: 확인 쿼리들
-- RLS 상태 확인
SELECT 
  '=== RLS STATUS ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users')
ORDER BY tablename;

-- 남은 정책 확인 (비어있어야 함)
SELECT 
  '=== REMAINING POLICIES ===' as info,
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users')
ORDER BY tablename, policyname;

-- 권한 확인
SELECT 
  '=== TABLE PERMISSIONS ===' as info,
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
  AND table_name IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 테이블 존재 확인
SELECT 
  '=== TABLE EXISTS ===' as info,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('doctors', 'customers', 'hospital_signup_codes', 'hospital_signup_code_usage', 'users')
ORDER BY tablename;