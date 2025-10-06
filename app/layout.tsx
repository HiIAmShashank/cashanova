import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { WebVitals } from '@/components/web-vitals';
import './globals.css';

export const metadata: Metadata = {
    title: 'Cashanova - Personal Finance & Budgeting',
    description: 'Track your finances, set budgets, and achieve your savings goals',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {/* Skip to main content link for keyboard navigation */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    Skip to main content
                </a>
                <WebVitals />
                {children}
                <Toaster />
            </body>
        </html>
    );
}
