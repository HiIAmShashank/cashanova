'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import type { TransactionWithCategory } from '@/types';

type SimpleCategory = {
    id: string;
    name: string;
    color: string;
};

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
    const [categories, setCategories] = useState<SimpleCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const [transactionsResult, categoriesResult] = await Promise.all([
            getTransactions({ limit: 100, sortBy: 'date', sortOrder: 'desc' }),
            getCategories(),
        ]);

        setTransactions(
            transactionsResult.success
                ? transactionsResult.data?.transactions || []
                : []
        );

        setCategories(
            categoriesResult.success
                ? categoriesResult.data?.categories || []
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
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                <p className="text-muted-foreground">Manage your income and expenses</p>
            </div>

            {isLoading ? (
                <Card className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </Card>
            ) : (
                <TransactionsTable
                    initialTransactions={transactions}
                    categories={categories.map((c) => ({
                        id: c.id,
                        name: c.name,
                        color: c.color,
                    }))}
                    onRefresh={handleRefresh}
                />
            )}
        </div>
    );
}