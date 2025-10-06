'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions/auth';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    Receipt,
    Target,
    Wallet,
    FolderOpen,
    Upload,
    LogOut,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
    { href: '/dashboard/budgets', label: 'Budgets', icon: Wallet },
    { href: '/dashboard/goals', label: 'Goals', icon: Target },
    { href: '/dashboard/categories', label: 'Categories', icon: FolderOpen },
    { href: '/dashboard/import', label: 'Import', icon: Upload },
];

export default function DashboardNav({ user }: { user: { email?: string } }) {
    const pathname = usePathname();

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            toast.success('Logged out successfully');
            window.location.href = '/login';
        } else {
            toast.error('Failed to log out');
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
                <div className="mr-4 flex">
                    <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
                        <span className="font-bold">Cashanova</span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium" aria-label="Main navigation">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 transition-colors hover:text-foreground/80',
                                        isActive ? 'text-foreground' : 'text-foreground/60'
                                    )}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <div className="hidden md:flex items-center text-sm text-muted-foreground" aria-label="Logged in user">
                        {user.email}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="gap-2"
                        aria-label="Logout from application"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Logout</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
