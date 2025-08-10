-- Row Level Security Policies for Obdoc MVP
-- 이 파일을 schema.sql 실행 후에 Supabase SQL Editor에서 실행하세요

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    auth.uid() = id OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors table policies
CREATE POLICY "Doctors can view own data" ON doctors
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.is_admin()
  );

CREATE POLICY "Doctors can update own data" ON doctors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow doctor registration" ON doctors
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'doctor')
  );

CREATE POLICY "Admins can manage all doctors" ON doctors
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Customers table policies
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (
    user_id = auth.uid() OR
    doctor_id = auth.get_doctor_id() OR
    auth.is_admin()
  );

CREATE POLICY "Doctors can manage their customers" ON customers
  FOR ALL USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Customers can update own data" ON customers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Doctors can create customers" ON customers
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Weight records table policies
CREATE POLICY "Customers can view own weight records" ON weight_records
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    customer_id IN (SELECT id FROM customers WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Doctors can manage customer weight records" ON weight_records
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Customers can create own weight records" ON weight_records
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Appointments table policies
CREATE POLICY "View appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Doctors can manage appointments" ON appointments
  FOR ALL USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Customers can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Community posts policies
CREATE POLICY "All customers can view community posts" ON community_posts
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM customers) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Customers can create posts" ON community_posts
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Authors can update own posts" ON community_posts
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Authors and admins can delete posts" ON community_posts
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Community comments policies
CREATE POLICY "All customers can view comments" ON community_comments
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM customers) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Customers can create comments" ON community_comments
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Authors can update own comments" ON community_comments
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Authors and admins can delete comments" ON community_comments
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Subscriptions table policies
CREATE POLICY "Doctors can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Doctors can create subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Additional security functions
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_doctor() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_customer() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'customer'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.get_doctor_id() RETURNS UUID AS $$
  SELECT id FROM doctors WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.get_customer_id() RETURNS UUID AS $$
  SELECT id FROM customers WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Test RLS policies (for development only)
CREATE OR REPLACE FUNCTION test_rls_policies() RETURNS TEXT AS $$
DECLARE
  result TEXT := 'RLS Policy Test Results:' || chr(10);
BEGIN
  -- Test user role functions
  result := result || 'Current user role: ' || COALESCE(auth.user_role(), 'No user') || chr(10);
  result := result || 'Is admin: ' || auth.is_admin()::TEXT || chr(10);
  result := result || 'Is doctor: ' || auth.is_doctor()::TEXT || chr(10);
  result := result || 'Is customer: ' || auth.is_customer()::TEXT || chr(10);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;