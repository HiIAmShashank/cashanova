'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBudget, updateBudget } from '@/lib/actions/budgets';
import { toast } from 'sonner';

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
};

type BudgetFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget?: Budget | null;
    categories: Category[];
    existingCategoryIds: string[];
    onSuccess: () => void;
};

const formSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    monthlyLimit: z.string().min(1, 'Monthly limit is required'),
});

export function BudgetFormModal({
    open,
    onOpenChange,
    budget,
    categories,
    existingCategoryIds,
    onSuccess,
}: BudgetFormProps) {
    const isEditing = !!budget;
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
            categoryId: budget?.categoryId || '',
            monthlyLimit: budget?.monthlyLimit.toString() || '',
        },
    });

    const selectedCategoryId = watch('categoryId');

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            const monthlyLimit = parseFloat(data.monthlyLimit);

            if (isEditing) {
                const result = await updateBudget({
                    id: budget.id,
                    monthlyLimit,
                });

                if (result.success) {
                    toast.success('Budget updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || 'Failed to update budget');
                }
            } else {
                // Get current month in YYYY-MM-01 format for DATE column
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

                const result = await createBudget({
                    categoryId: data.categoryId,
                    monthlyLimit,
                    month: currentMonth,
                });

                if (result.success) {
                    toast.success('Budget created successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to create budget');
                }
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableCategories = categories.filter(
        (c) => !existingCategoryIds.includes(c.id) || c.id === budget?.categoryId
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Budget' : 'Create Budget'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the monthly spending limit for this category.'
                            : 'Set a monthly spending limit for a category.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={selectedCategoryId}
                            onValueChange={(value) => setValue('categoryId', value)}
                            disabled={isEditing}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            {category.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.categoryId && (
                            <p className="text-sm text-destructive">
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthlyLimit">Monthly Limit</Label>
                        <Input
                            id="monthlyLimit"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register('monthlyLimit')}
                        />
                        {errors.monthlyLimit && (
                            <p className="text-sm text-destructive">
                                {errors.monthlyLimit.message}
                            </p>
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
