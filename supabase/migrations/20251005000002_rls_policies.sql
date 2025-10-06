-- Migration: Row Level Security policies
-- Created: 2025-10-05
-- Description: Enables RLS and creates policies for all tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_imports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: categories
-- ============================================================================
-- Everyone can view system categories
CREATE POLICY "Anyone can view system categories" ON categories
  FOR SELECT USING (type = 'system');

-- Users can view their own custom categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create custom categories
CREATE POLICY "Users can create custom categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'custom');

-- Users can update own custom categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND type = 'custom');

-- Users can delete own custom categories
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND type = 'custom');

-- ============================================================================
-- POLICIES: transactions
-- ============================================================================
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: goals
-- ============================================================================
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: budgets
-- ============================================================================
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: statement_imports
-- ============================================================================
CREATE POLICY "Users can view own imports" ON statement_imports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own imports" ON statement_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imports" ON statement_imports
  FOR UPDATE USING (auth.uid() = user_id);
