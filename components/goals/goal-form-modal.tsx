'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGoal, updateGoal } from '@/lib/actions/goals';
import { toast } from 'sonner';

type Goal = {
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    targetDate?: string;
    color: string;
    icon?: string;
};

type GoalFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goal?: Goal | null;
    onSuccess: () => void;
};

const formSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    targetAmount: z.string().min(1, 'Target amount is required'),
    targetDate: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
});

const DEFAULT_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
];

export function GoalFormModal({ open, onOpenChange, goal, onSuccess }: GoalFormProps) {
    const isEditing = !!goal;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: goal?.name || '',
            description: goal?.description || '',
            targetAmount: goal?.targetAmount.toString() || '',
            targetDate: goal?.targetDate || '',
            color: goal?.color || DEFAULT_COLORS[0],
        },
    });

    const selectedColor = watch('color');

    useEffect(() => {
        if (goal) {
            reset({
                name: goal.name,
                description: goal.description || '',
                targetAmount: goal.targetAmount.toString(),
                targetDate: goal.targetDate || '',
                color: goal.color,
            });
        } else {
            reset({
                name: '',
                description: '',
                targetAmount: '',
                targetDate: '',
                color: DEFAULT_COLORS[0],
            });
        }
    }, [goal, reset]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            const targetAmount = parseFloat(data.targetAmount);

            if (isEditing) {
                const result = await updateGoal({
                    id: goal.id,
                    name: data.name,
                    description: data.description || null,
                    targetAmount,
                    targetDate: data.targetDate || null,
                    color: data.color,
                });

                if (result.success) {
                    toast.success('Goal updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || 'Failed to update goal');
                }
            } else {
                const result = await createGoal({
                    name: data.name,
                    description: data.description,
                    targetAmount,
                    targetDate: data.targetDate,
                    color: data.color,
                });

                if (result.success) {
                    toast.success('Goal created successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to create goal');
                }
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your savings goal details.'
                            : 'Create a new savings goal to track your progress.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Emergency Fund"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            placeholder="What is this goal for?"
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="targetAmount">Target Amount</Label>
                            <Input
                                id="targetAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...register('targetAmount')}
                            />
                            {errors.targetAmount && (
                                <p className="text-sm text-destructive">
                                    {errors.targetAmount.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetDate">Target Date (Optional)</Label>
                            <Input
                                id="targetDate"
                                type="date"
                                {...register('targetDate')}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            {errors.targetDate && (
                                <p className="text-sm text-destructive">
                                    {errors.targetDate.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === color
                                            ? 'scale-110 border-foreground'
                                            : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setValue('color', color)}
                                />
                            ))}
                        </div>
                        {errors.color && (
                            <p className="text-sm text-destructive">{errors.color.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update'
                                    : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
