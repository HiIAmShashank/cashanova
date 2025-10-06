# Supabase Database Setup

This directory contains SQL migration files for the Cashanova database schema.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your credentials**:
   - Go to Project Settings → API
   - Copy `Project URL` → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key (secret) → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

3. **Run migrations**:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and run each migration file in order:
     1. `20251005000001_initial_schema.sql`
     2. `20251005000002_rls_policies.sql`
     3. `20251005000003_seed_categories.sql`

4. **Verify setup**:
   - Go to Table Editor and verify all 5 tables exist
   - Go to Authentication → Policies and verify RLS is enabled

### Option 2: Using Supabase CLI (For local development)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_ID
   ```

3. **Apply migrations**:
   ```bash
   npx supabase db push
   ```

4. **Generate TypeScript types** (after any schema changes):
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
   ```

## Schema Overview

### Tables

1. **categories** - Transaction categorization (system + user custom)
2. **transactions** - Financial events (income/expenses)
3. **goals** - Savings targets with progress tracking
4. **budgets** - Monthly budget limits
5. **statement_imports** - PDF upload history and status

### Features

- ✅ Row Level Security (RLS) policies on all tables
- ✅ Automatic `updated_at` timestamp triggers
- ✅ Category deletion protection (prevents deletion if transactions exist)
- ✅ Foreign key constraints with cascading deletes
- ✅ Indexes on commonly queried columns
- ✅ 32 pre-seeded system categories

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Never commit `.env.local` to version control!** It's already in `.gitignore`.

## Testing the Setup

After running migrations, test in the Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verify system categories
SELECT COUNT(*) FROM categories WHERE type = 'system';
-- Should return 32

-- Test authentication (create a test user in Auth UI first)
SELECT * FROM categories WHERE type = 'system';
-- Should work without authentication

-- Test user isolation (as authenticated user)
INSERT INTO transactions (user_id, date, description, amount, type)
VALUES (auth.uid(), CURRENT_DATE, 'Test', 10.00, 'debit');
-- Should succeed only for your own user_id
```

## Migration Files

- **20251005000001_initial_schema.sql** - Creates all tables, indexes, and triggers
- **20251005000002_rls_policies.sql** - Enables RLS and defines security policies
- **20251005000003_seed_categories.sql** - Inserts default system categories

## Troubleshooting

**Problem**: RLS blocks all queries  
**Solution**: Make sure you're authenticated. Use `auth.uid()` in policies.

**Problem**: "relation does not exist"  
**Solution**: Run migrations in order. Schema must exist before policies.

**Problem**: TypeScript type errors  
**Solution**: Regenerate types after schema changes using `npx supabase gen types`

**Problem**: Cannot delete category  
**Solution**: This is by design! Reassign transactions to another category first.

## Next Steps

After database setup:
1. Update `.env.local` with your Supabase credentials
2. Restart the dev server: `npm run dev`
3. Test authentication flow
4. Proceed with implementing Server Actions (Phase 3.3)
