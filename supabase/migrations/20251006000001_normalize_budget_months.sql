-- ============================================================================
-- Migration: Normalize budget month dates to first of month
-- Created: 2025-10-06
-- Description: Updates all budget records to store month as YYYY-MM-01
--              This ensures consistent querying and prevents display issues
-- ============================================================================

-- Update all existing budget months to the first day of their month
UPDATE budgets 
SET month = DATE_TRUNC('month', month)::date
WHERE EXTRACT(DAY FROM month) != 1;

-- Add a constraint to ensure future budgets are always on the 1st
-- Note: This constraint may be too strict if you want flexibility
-- Uncomment if you want to enforce this at database level:
-- ALTER TABLE budgets 
-- ADD CONSTRAINT budgets_month_must_be_first_of_month 
-- CHECK (EXTRACT(DAY FROM month) = 1);

-- Verification query
-- SELECT id, month, category_id, monthly_limit 
-- FROM budgets 
-- ORDER BY month DESC;
