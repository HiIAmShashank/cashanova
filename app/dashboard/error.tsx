'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <CardTitle>Dashboard Error</CardTitle>
                    </div>
                    <CardDescription>
                        Failed to load dashboard data. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="p-3 bg-muted rounded-md">
                            <p className="text-xs font-mono text-muted-foreground">
                                {error.message}
                            </p>
                        </div>
                    )}
                    <Button onClick={() => reset()} className="w-full">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
