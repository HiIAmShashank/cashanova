import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client for use in Client Components
 * Automatically handles session management in the browser
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
