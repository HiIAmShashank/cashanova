-- ============================================================================
-- Migration: Add missing columns to goals and budgets tables
-- Created: 2025-10-05
-- Description: Adds description, target_date, icon, status to goals table
--              and category_id, monthly_limit to budgets table
-- 
-- HOW TO RUN THIS MIGRATION:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire SQL script
-- 4. Click "Run" to execute
-- ============================================================================

-- ============================================================================
-- TABLE: goals - Add missing columns
-- ============================================================================

-- Add description column (optional text field)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT;

-- Add target_date column (optional future date)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add icon column (optional icon name for UI)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add status column (track goal completion)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'completed'));

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

-- ============================================================================
-- TABLE: budgets - Restructure for category-based budgets
-- ============================================================================

-- Add category_id column (link budgets to specific categories)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id UUID 
  REFERENCES categories(id) ON DELETE CASCADE;

-- Add monthly_limit column (replace generic 'amount' with more descriptive name)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(12, 2) 
  CHECK (monthly_limit > 0);

-- Migrate existing data: copy amount to monthly_limit
UPDATE budgets SET monthly_limit = amount 
WHERE monthly_limit IS NULL AND amount IS NOT NULL;

-- Drop old unique constraint
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS unique_user_month;

-- Add new unique constraint for user-category-month combination
ALTER TABLE budgets ADD CONSTRAINT unique_user_category_month 
  UNIQUE (user_id, category_id, month);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category_month ON budgets(user_id, category_id, month DESC);

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to check results)
-- ============================================================================

-- Check goals table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'goals' 
-- ORDER BY ordinal_position;

-- Check budgets table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'budgets' 
-- ORDER BY ordinal_position;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- The 'month' column in budgets table is of type DATE.
-- When inserting budgets, always use full date format: YYYY-MM-01
-- Example: '2025-10-01' for October 2025
-- The application code automatically handles this conversion.
