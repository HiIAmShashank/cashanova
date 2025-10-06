'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console in development
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <CardTitle>Something went wrong</CardTitle>
                    </div>
                    <CardDescription>
                        An unexpected error occurred. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="p-4 bg-muted rounded-md">
                            <p className="text-sm font-mono text-muted-foreground">
                                {error.message}
                            </p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={() => reset()} variant="default" className="flex-1">
                            Try again
                        </Button>
                        <Button
                            onClick={() => (window.location.href = '/dashboard')}
                            variant="outline"
                            className="flex-1"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
