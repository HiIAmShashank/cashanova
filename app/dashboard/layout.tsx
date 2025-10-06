import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav user={user} />
            <main id="main-content" className="flex-1 bg-muted/40 p-4 md:p-8" role="main">
                {children}
            </main>
        </div>
    );
}
