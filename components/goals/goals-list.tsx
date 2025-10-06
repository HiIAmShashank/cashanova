'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { GoalFormModal } from './goal-form-modal';
import { AllocateFundsModal } from './allocate-funds-modal';
import { deleteGoal } from '@/lib/actions/goals';
import { toast } from 'sonner';
import { Plus, Target, Pencil, Trash2, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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

type GoalsListProps = {
    goals: Goal[];
    onRefresh: () => void;
};

export function GoalsList({ goals, onRefresh }: GoalsListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [allocateModalOpen, setAllocateModalOpen] = useState(false);
    const [allocateMode, setAllocateMode] = useState<'allocate' | 'deallocate'>('allocate');
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingGoalId) return;

        setIsDeleting(true);
        try {
            const result = await deleteGoal(deletingGoalId);

            if (result.success) {
                toast.success('Goal deleted successfully');
                onRefresh();
            } else {
                toast.error(result.error || 'Failed to delete goal');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setDeletingGoalId(null);
        }
    };

    const openAllocateModal = (goal: Goal, mode: 'allocate' | 'deallocate') => {
        setSelectedGoal(goal);
        setAllocateMode(mode);
        setAllocateModalOpen(true);
    };

    const handleFormSuccess = () => {
        onRefresh();
        setEditingGoal(null);
    };

    // Calculate totals
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getStatusBadge = (currentAmount: number, targetAmount: number) => {
        if (currentAmount >= targetAmount) {
            return <Badge className="bg-green-500">Achieved</Badge>;
        }
        const percentage = (currentAmount / targetAmount) * 100;
        if (percentage >= 75) {
            return <Badge className="bg-blue-500">Almost There</Badge>;
        }
        if (percentage >= 50) {
            return <Badge className="bg-yellow-500">On Track</Badge>;
        }
        return <Badge variant="outline">In Progress</Badge>;
    };

    return (
        <>
            {/* Summary Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Goals Summary
                            </CardTitle>
                            <CardDescription>Overview of all your savings goals</CardDescription>
                        </div>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Goal
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(totalSaved)}</div>
                            <p className="text-xs text-muted-foreground">Total Saved</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
                            <p className="text-xs text-muted-foreground">Total Target</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">Overall Progress</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(overallProgress)}`}
                                style={{ width: `${Math.min(overallProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                    {goals.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {goals.filter((g) => g.currentAmount >= g.targetAmount).length} of{' '}
                            {goals.length} goals achieved
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Goals List */}
            {goals.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                            Start by creating your first savings goal. Track your progress and stay
                            motivated!
                        </p>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Goal
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {goals.map((goal) => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100;
                        const remaining = goal.targetAmount - goal.currentAmount;

                        return (
                            <Card key={goal.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div
                                                className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: goal.color }}
                                            >
                                                <Target className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg truncate">
                                                    {goal.name}
                                                </CardTitle>
                                                {goal.description && (
                                                    <CardDescription className="line-clamp-2">
                                                        {goal.description}
                                                    </CardDescription>
                                                )}
                                                {goal.targetDate && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(goal.targetDate)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(goal.currentAmount, goal.targetAmount)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                Progress
                                            </span>
                                            <span className="text-sm font-medium">
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-secondary">
                                            <div
                                                className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-baseline">
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(goal.currentAmount)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                of {formatCurrency(goal.targetAmount)}
                                            </p>
                                        </div>
                                        {remaining > 0 && (
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-muted-foreground">
                                                    {formatCurrency(remaining)}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    remaining
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => openAllocateModal(goal, 'allocate')}
                                        >
                                            <ArrowUpCircle className="h-4 w-4 mr-1" />
                                            Add Funds
                                        </Button>
                                        {goal.currentAmount > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => openAllocateModal(goal, 'deallocate')}
                                            >
                                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                                                Remove Funds
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleEdit(goal)}
                                        >
                                            <Pencil className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setDeletingGoalId(goal.id);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Goal Form Modal */}
            <GoalFormModal
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingGoal(null);
                }}
                goal={editingGoal}
                onSuccess={handleFormSuccess}
            />

            {/* Allocate Funds Modal */}
            {selectedGoal && (
                <AllocateFundsModal
                    open={allocateModalOpen}
                    onOpenChange={setAllocateModalOpen}
                    goalId={selectedGoal.id}
                    goalName={selectedGoal.name}
                    currentAmount={selectedGoal.currentAmount}
                    targetAmount={selectedGoal.targetAmount}
                    mode={allocateMode}
                    onSuccess={onRefresh}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete this goal. This action cannot be undone.
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
                            onClick={handleDelete}
                            disabled={isDeleting}
                            variant="destructive"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
