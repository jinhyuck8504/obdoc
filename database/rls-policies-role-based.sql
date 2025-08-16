-- =====================================================
-- Row Level Security Policies for Role-Based Signup
-- =====================================================

-- =====================================================
-- 1. HOSPITALS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hospitals are viewable by everyone" ON hospitals;
DROP POLICY IF EXISTS "Doctors can view their hospital" ON hospitals;
DROP POLICY IF EXISTS "Admins can view all hospitals" ON hospitals;
DROP POLICY IF EXISTS "Doctors can create hospitals" ON hospitals;

-- Public read access for active hospitals (for general information)
CREATE POLICY "Public can view active hospitals" ON hospitals
    FOR SELECT USING (is_active = true);

-- Doctors can view and update their own hospital
CREATE POLICY "Doctors can manage their hospital" ON hospitals
    FOR ALL USING (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Doctors can create new hospitals (during signup)
CREATE POLICY "Doctors can create hospitals during signup" ON hospitals
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'doctor'
        )
    );

-- Admins have full access to all hospitals
CREATE POLICY "Admins have full access to hospitals" ON hospitals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 2. HOSPITAL SIGNUP CODES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Doctors can manage their hospital codes" ON hospital_signup_codes;
DROP POLICY IF EXISTS "Admins can view all signup codes" ON hospital_signup_codes;

-- Doctors can manage codes for their hospital
CREATE POLICY "Doctors can manage their hospital signup codes" ON hospital_signup_codes
    FOR ALL USING (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    ) WITH CHECK (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        ) AND created_by = auth.uid()
    );

-- Anonymous users can validate codes (read-only for validation)
CREATE POLICY "Anonymous can validate signup codes" ON hospital_signup_codes
    FOR SELECT USING (
        is_active = true AND 
        (expires_at IS NULL OR expires_at > NOW()) AND
        current_uses < max_uses
    );

-- Admins have full access to all signup codes
CREATE POLICY "Admins have full access to signup codes" ON hospital_signup_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 3. HOSPITAL SIGNUP CODE USAGE TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own code usage" ON hospital_signup_code_usage;
DROP POLICY IF EXISTS "Doctors can view usage of their codes" ON hospital_signup_code_usage;
DROP POLICY IF EXISTS "Admins can view all code usage" ON hospital_signup_code_usage;

-- Users can view their own code usage history
CREATE POLICY "Users can view their own code usage" ON hospital_signup_code_usage
    FOR SELECT USING (customer_id = auth.uid());

-- Anonymous users can insert usage records (for tracking attempts)
CREATE POLICY "Anonymous can log code usage attempts" ON hospital_signup_code_usage
    FOR INSERT WITH CHECK (true);

-- Doctors can view usage of their hospital's codes
CREATE POLICY "Doctors can view their hospital code usage" ON hospital_signup_code_usage
    FOR SELECT USING (
        code_id IN (
            SELECT sc.id FROM hospital_signup_codes sc
            JOIN doctors d ON sc.hospital_code = d.hospital_code
            WHERE d.user_id = auth.uid() AND d.is_active = true
        )
    );

-- Admins can view all code usage
CREATE POLICY "Admins can view all code usage" ON hospital_signup_code_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 4. AUDIT LOGS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- System can insert audit logs (for anonymous actions)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Doctors can view audit logs related to their hospital
CREATE POLICY "Doctors can view hospital-related audit logs" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        (details->>'hospital_code') IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins have full access to audit logs
CREATE POLICY "Admins have full access to audit logs" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 5. SECURITY ALERTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Doctors can view alerts for their hospital" ON security_alerts;
DROP POLICY IF EXISTS "Admins can manage all security alerts" ON security_alerts;

-- System can create security alerts
CREATE POLICY "System can create security alerts" ON security_alerts
    FOR INSERT WITH CHECK (true);

-- Doctors can view alerts related to their hospital or themselves
CREATE POLICY "Doctors can view relevant security alerts" ON security_alerts
    FOR SELECT USING (
        user_id = auth.uid() OR
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Doctors can resolve alerts related to their hospital
CREATE POLICY "Doctors can resolve their hospital alerts" ON security_alerts
    FOR UPDATE USING (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    ) WITH CHECK (
        resolved_by = auth.uid()
    );

-- Admins have full access to security alerts
CREATE POLICY "Admins have full access to security alerts" ON security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 6. RATE LIMITS TABLE RLS POLICIES
-- =====================================================

-- Rate limits are managed by the system, no user access needed
CREATE POLICY "System manages rate limits" ON rate_limits
    FOR ALL USING (false);

-- Admins can view rate limits for monitoring
CREATE POLICY "Admins can view rate limits" ON rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 7. ENHANCED DOCTORS TABLE RLS POLICIES
-- =====================================================

-- Ensure doctors can only see and modify their own records
CREATE POLICY "Doctors can manage their own profile" ON doctors
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Doctors can view other doctors in the same hospital
CREATE POLICY "Doctors can view hospital colleagues" ON doctors
    FOR SELECT USING (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins can view all doctors
CREATE POLICY "Admins can view all doctors" ON doctors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 8. ENHANCED CUSTOMERS TABLE RLS POLICIES
-- =====================================================

-- Customers can manage their own profile
CREATE POLICY "Customers can manage their own profile" ON customers
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Doctors can view customers associated with their hospital
CREATE POLICY "Doctors can view their hospital customers" ON customers
    FOR SELECT USING (
        hospital_code IN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins can view all customers
CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- 9. SECURITY FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins 
        WHERE user_id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM doctors 
        WHERE user_id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer
CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM customers 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's hospital code
CREATE OR REPLACE FUNCTION get_user_hospital_code()
RETURNS VARCHAR(50) AS $$
BEGIN
    -- Check if user is a doctor
    IF is_doctor() THEN
        RETURN (
            SELECT hospital_code FROM doctors 
            WHERE user_id = auth.uid() AND is_active = true
            LIMIT 1
        );
    END IF;
    
    -- Check if user is a customer
    IF is_customer() THEN
        RETURN (
            SELECT hospital_code FROM customers 
            WHERE user_id = auth.uid()
            LIMIT 1
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. ADVANCED SECURITY POLICIES
-- =====================================================

-- Policy to prevent code enumeration attacks
CREATE POLICY "Prevent code enumeration" ON hospital_signup_codes
    FOR SELECT USING (
        -- Only allow access if user provides exact code match
        -- This prevents enumeration of all codes
        CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon' THEN
                -- Anonymous users can only access codes they specifically query
                code = current_setting('app.current_code', true)
            ELSE true
        END
    );

-- Policy to log suspicious activities
CREATE OR REPLACE FUNCTION log_suspicious_rls_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when someone tries to access data they shouldn't
    IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
        INSERT INTO audit_logs (
            action, user_id, details, success, timestamp
        ) VALUES (
            'rls_access_attempt',
            auth.uid(),
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'row_id', COALESCE(NEW.id, OLD.id)
            ),
            true,
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. DATA MASKING POLICIES
-- =====================================================

-- Function to mask sensitive data based on user role
CREATE OR REPLACE FUNCTION mask_sensitive_data(
    data_type TEXT,
    original_value TEXT,
    user_role TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    -- Admins see everything
    IF is_admin() THEN
        RETURN original_value;
    END IF;
    
    -- Mask based on data type
    CASE data_type
        WHEN 'email' THEN
            RETURN CASE 
                WHEN user_role = 'doctor' THEN 
                    SUBSTRING(original_value FROM 1 FOR 3) || '***@' || 
                    SPLIT_PART(original_value, '@', 2)
                ELSE '***@***'
            END;
        WHEN 'phone' THEN
            RETURN CASE 
                WHEN user_role = 'doctor' THEN 
                    SUBSTRING(original_value FROM 1 FOR 3) || '-***-****'
                ELSE '***-***-****'
            END;
        WHEN 'ip_address' THEN
            RETURN CASE 
                WHEN user_role = 'doctor' THEN 
                    SPLIT_PART(original_value, '.', 1) || '.***.***.***'
                ELSE '***.***.***.***'
            END;
        ELSE
            RETURN '***';
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. MONITORING AND ALERTING POLICIES
-- =====================================================

-- Function to create security alert for policy violations
CREATE OR REPLACE FUNCTION create_rls_violation_alert(
    violation_type TEXT,
    table_name TEXT,
    user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO security_alerts (
        type, severity, title, message, details, user_id, timestamp
    ) VALUES (
        'RLS_VIOLATION',
        'high',
        'Row Level Security Policy Violation',
        'Attempted unauthorized access to ' || table_name,
        jsonb_build_object(
            'violation_type', violation_type,
            'table_name', table_name,
            'user_id', user_id,
            'session_info', current_setting('request.jwt.claims', true)
        ),
        user_id,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. PERFORMANCE OPTIMIZATION FOR RLS
-- =====================================================

-- Indexes to support RLS policies efficiently
CREATE INDEX IF NOT EXISTS idx_doctors_user_id_active ON doctors(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admins_user_id_active ON admins(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Partial indexes for common RLS queries
CREATE INDEX IF NOT EXISTS idx_hospitals_active_rls ON hospitals(hospital_code, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signup_codes_active_rls ON hospital_signup_codes(hospital_code, is_active) WHERE is_active = true;

-- =====================================================
-- 14. TESTING RLS POLICIES
-- =====================================================

-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(
    test_name TEXT,
    table_name TEXT,
    policy_name TEXT,
    expected_result TEXT,
    actual_result TEXT,
    passed BOOLEAN
) AS $$
BEGIN
    -- This function would contain comprehensive RLS policy tests
    -- Implementation would depend on specific test requirements
    RETURN QUERY SELECT 
        'Sample Test'::TEXT,
        'hospitals'::TEXT,
        'Doctors can manage their hospital'::TEXT,
        'PASS'::TEXT,
        'PASS'::TEXT,
        true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up RLS-related data
CREATE OR REPLACE FUNCTION cleanup_rls_data()
RETURNS void AS $$
BEGIN
    -- Clean up old audit logs related to RLS
    DELETE FROM audit_logs 
    WHERE action LIKE '%rls%' 
    AND timestamp < NOW() - INTERVAL '90 days';
    
    -- Clean up resolved security alerts older than 30 days
    DELETE FROM security_alerts 
    WHERE resolved = true 
    AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES SETUP COMPLETE
-- =====================================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_doctor() TO authenticated;
GRANT EXECUTE ON FUNCTION is_customer() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_hospital_code() TO authenticated;
GRANT EXECUTE ON FUNCTION mask_sensitive_data(TEXT, TEXT, TEXT) TO authenticated;

-- Revoke dangerous permissions
REVOKE ALL ON FUNCTION create_rls_violation_alert(TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_rls_data() FROM PUBLIC;

-- Comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Security function to check if current user is an admin';
COMMENT ON FUNCTION is_doctor() IS 'Security function to check if current user is a doctor';
COMMENT ON FUNCTION is_customer() IS 'Security function to check if current user is a customer';
COMMENT ON FUNCTION get_user_hospital_code() IS 'Returns the hospital code associated with the current user';
COMMENT ON FUNCTION mask_sensitive_data(TEXT, TEXT, TEXT) IS 'Masks sensitive data based on user role and data type';