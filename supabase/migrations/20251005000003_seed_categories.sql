-- Migration: Seed system categories
-- Created: 2025-10-05
-- Description: Inserts default system categories

INSERT INTO categories (name, type, color, icon) VALUES
  -- Income categories
  ('Salary', 'system', '#10b981', 'banknote'),
  ('Freelance', 'system', '#10b981', 'briefcase'),
  ('Bonus', 'system', '#10b981', 'gift'),
  ('Refund', 'system', '#10b981', 'arrow-uturn-left'),
  ('Other Income', 'system', '#10b981', 'currency-dollar'),
  
  -- Housing categories
  ('Rent', 'system', '#f59e0b', 'home'),
  ('Mortgage', 'system', '#f59e0b', 'home-modern'),
  ('Utilities', 'system', '#f59e0b', 'bolt'),
  ('Maintenance', 'system', '#f59e0b', 'wrench-screwdriver'),
  
  -- Food categories
  ('Groceries', 'system', '#8b5cf6', 'shopping-cart'),
  ('Restaurants', 'system', '#8b5cf6', 'utensils'),
  ('Coffee', 'system', '#8b5cf6', 'coffee'),
  
  -- Transportation categories
  ('Gas', 'system', '#ef4444', 'fuel'),
  ('Public Transit', 'system', '#ef4444', 'bus'),
  ('Parking', 'system', '#ef4444', 'parking'),
  ('Car Maintenance', 'system', '#ef4444', 'wrench'),
  
  -- Entertainment categories
  ('Movies', 'system', '#ec4899', 'film'),
  ('Subscriptions', 'system', '#ec4899', 'rectangle-stack'),
  ('Hobbies', 'system', '#ec4899', 'puzzle-piece'),
  ('Sports', 'system', '#ec4899', 'football'),
  
  -- Shopping categories
  ('Clothing', 'system', '#06b6d4', 'shopping-bag'),
  ('Electronics', 'system', '#06b6d4', 'device-phone-mobile'),
  ('Home Goods', 'system', '#06b6d4', 'home'),
  ('Books', 'system', '#06b6d4', 'book-open'),
  
  -- Health categories
  ('Medical', 'system', '#14b8a6', 'heart'),
  ('Pharmacy', 'system', '#14b8a6', 'beaker'),
  ('Fitness', 'system', '#14b8a6', 'fitness'),
  ('Insurance', 'system', '#14b8a6', 'shield-check'),
  
  -- Personal categories
  ('Personal Care', 'system', '#a855f7', 'sparkles'),
  ('Education', 'system', '#a855f7', 'academic-cap'),
  ('Gifts', 'system', '#a855f7', 'gift'),
  
  -- Other
  ('Uncategorized', 'system', '#6b7280', 'question-mark-circle');
