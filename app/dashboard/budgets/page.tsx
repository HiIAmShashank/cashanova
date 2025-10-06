'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBudgets } from '@/lib/actions/budgets';
import { getCategories } from '@/lib/actions/categories';
import { BudgetsList } from '@/components/budgets/budgets-list';

type Category = {
    id: string;
    name: string;
    color: string;
};

type Budget = {
    id: string;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    monthlyLimit: number;
    currentSpending: number;
    remainingAmount: number;
    percentageUsed: number;
    status: 'on_track' | 'warning' | 'exceeded';
};

type BudgetSummary = {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    categoriesExceeded: number;
};

export default function BudgetsPage() {
    const router = useRouter();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [summary, setSummary] = useState<BudgetSummary>({
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
        categoriesExceeded: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [budgetsResult, categoriesResult] = await Promise.all([
            getBudgets({ month: currentMonth }),
            getCategories(),
        ]);

        if (budgetsResult.success && budgetsResult.data) {
            setBudgets(budgetsResult.data.budgets);
            setSummary(budgetsResult.data.summary);
        }

        setCategories(
            categoriesResult.success
                ? categoriesResult.data?.categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    color: c.color,
                })) || []
                : []
        );

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = () => {
        loadData();
        router.refresh();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
                <p className="text-muted-foreground">
                    Set and track your monthly spending limits
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Card className="p-6">
                        <Skeleton className="h-32 w-full" />
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="p-6">
                            <Skeleton className="h-40 w-full" />
                        </Card>
                        <Card className="p-6">
                            <Skeleton className="h-40 w-full" />
                        </Card>
                    </div>
                </div>
            ) : (
                <BudgetsList
                    budgets={budgets}
                    categories={categories}
                    summary={summary}
                    onRefresh={handleRefresh}
                />
            )}
        </div>
    );
}