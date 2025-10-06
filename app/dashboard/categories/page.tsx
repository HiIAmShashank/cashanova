'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesList } from '@/components/categories/categories-list';
import { getCategories } from '@/lib/actions/categories';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

type Category = {
    id: string;
    name: string;
    color: string;
    icon?: string;
    isSystem: boolean;
    createdAt: string;
    transactionCount?: number;
    totalAmount?: number;
};

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const result = await getCategories({
                includeSystem: true,
                includeUsage: true,
            });
            if (result.success && result.data) {
                setCategories(result.data.categories as Category[]);
            }
        } catch {
            console.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleRefresh = () => {
        loadCategories();
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
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Category Cards Skeletons */}
                <div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground">
                    Organize your transactions
                </p>
            </div>

            <CategoriesList categories={categories} onRefresh={handleRefresh} />
        </div>
    );
}
