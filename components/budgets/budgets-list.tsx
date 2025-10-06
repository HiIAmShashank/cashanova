'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { BudgetFormModal } from '@/components/budgets/budget-form-modal';
import { deleteBudget } from '@/lib/actions/budgets';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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

type BudgetsListProps = {
    budgets: Budget[];
    categories: Category[];
    summary: {
        totalBudgeted: number;
        totalSpent: number;
        totalRemaining: number;
        overallPercentage: number;
        categoriesExceeded: number;
    };
    onRefresh: () => void;
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'on_track':
            return 'bg-green-500';
        case 'warning':
            return 'bg-yellow-500';
        case 'exceeded':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
}

function getStatusVariant(
    status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'exceeded':
            return 'destructive';
        case 'warning':
            return 'secondary';
        default:
            return 'default';
    }
}

export function BudgetsList({
    budgets,
    categories,
    summary,
    onRefresh,
}: BudgetsListProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const existingCategoryIds = budgets.map((b) => b.categoryId);

    const handleDelete = async () => {
        if (!selectedBudget) return;

        setIsDeleting(true);
        try {
            const result = await deleteBudget(selectedBudget.id);

            if (result.success) {
                toast.success('Budget deleted successfully');
                setDeleteDialogOpen(false);
                setSelectedBudget(null);
                onRefresh();
            } else {
                toast.error(result.error || 'Failed to delete budget');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Summary Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Monthly Budget Overview
                        </CardTitle>
                        {summary.categoriesExceeded > 0 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(summary.totalSpent)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        of {formatCurrency(summary.totalBudgeted)} budgeted
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        summary.categoriesExceeded > 0
                                            ? 'destructive'
                                            : 'default'
                                    }
                                >
                                    {summary.categoriesExceeded > 0
                                        ? `${summary.categoriesExceeded} over budget`
                                        : 'On track'}
                                </Badge>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Overall Progress
                                    </span>
                                    <span className="font-medium">
                                        {summary.overallPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className={`h-full transition-all ${summary.overallPercentage >= 100
                                                ? 'bg-destructive'
                                                : summary.overallPercentage >= 80
                                                    ? 'bg-yellow-500'
                                                    : 'bg-primary'
                                            }`}
                                        style={{
                                            width: `${Math.min(summary.overallPercentage, 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Remaining</div>
                                    <div className="font-medium text-green-600">
                                        {formatCurrency(summary.totalRemaining)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Categories</div>
                                    <div className="font-medium">{budgets.length}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Budget Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={() => {
                            setSelectedBudget(null);
                            setFormOpen(true);
                        }}
                        disabled={existingCategoryIds.length === categories.length}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Budget
                    </Button>
                </div>

                {/* Budgets List */}
                {budgets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No budgets yet. Create your first budget to start tracking
                            spending limits.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {budgets.map((budget) => (
                            <Card key={budget.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{
                                                    backgroundColor: budget.categoryColor,
                                                }}
                                            />
                                            <CardTitle className="text-base">
                                                {budget.categoryName}
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedBudget(budget);
                                                    setFormOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedBudget(budget);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-2xl font-bold">
                                            {formatCurrency(budget.currentSpending)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            of {formatCurrency(budget.monthlyLimit)}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <Badge variant={getStatusVariant(budget.status)}>
                                                {budget.status === 'on_track'
                                                    ? 'On Track'
                                                    : budget.status === 'warning'
                                                        ? 'Warning'
                                                        : 'Exceeded'}
                                            </Badge>
                                            <span className="font-medium">
                                                {budget.percentageUsed.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={`h-full transition-all ${getStatusColor(budget.status)}`}
                                                style={{
                                                    width: `${Math.min(budget.percentageUsed, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Remaining</span>
                                        <span
                                            className={`font-medium ${budget.remainingAmount >= 0
                                                    ? 'text-green-600'
                                                    : 'text-destructive'
                                                }`}
                                        >
                                            {formatCurrency(Math.abs(budget.remainingAmount))}
                                            {budget.remainingAmount < 0 && ' over'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Budget Form Modal */}
            <BudgetFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                budget={selectedBudget}
                categories={categories}
                existingCategoryIds={existingCategoryIds}
                onSuccess={onRefresh}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Budget</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this budget for{' '}
                            <strong>{selectedBudget?.categoryName}</strong>? This will not
                            affect your transactions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
