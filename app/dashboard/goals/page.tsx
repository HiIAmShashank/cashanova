'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoalsList } from '@/components/goals/goals-list';
import { getGoals } from '@/lib/actions/goals';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

type Goal = {
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
    color: string;
    icon?: string;
    status: 'active' | 'completed';
    progress: number;
    createdAt: string;
    updatedAt: string;
};

export default function GoalsPage() {
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const result = await getGoals({
                status: 'all',
                sortBy: 'created_at',
                sortOrder: 'desc',
            });
            if (result.success && result.data) {
                setGoals(result.data.goals as Goal[]);
            }
        } catch {
            console.error('Failed to load goals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGoals();
    }, []);

    const handleRefresh = () => {
        loadGoals();
        router.refresh();
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Summary Card Skeleton */}
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="grid gap-4 md:grid-cols-3 mb-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                    </CardContent>
                </Card>

                {/* Goal Cards Skeletons */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
                <p className="text-muted-foreground">
                    Set and achieve your savings goals
                </p>
            </div>

            <GoalsList goals={goals} onRefresh={handleRefresh} />
        </div>
    );
}
