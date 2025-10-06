'use client';

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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingButton } from '@/components/forms/loading-button';
import { FormErrorSummary } from '@/components/forms/form-error-summary';
import { DatePicker } from '@/components/forms/date-picker';
import { createBudget, updateBudget } from '@/lib/actions/budgets';
import { useFormToast } from '@/hooks/use-form-toast';
import { BudgetFormSchema } from '@/lib/schemas/budgets';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';
import { formatMonthForDB, convertFromUTC } from '@/lib/utils/form-helpers';

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
    month?: string;
};

type BudgetFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget?: Budget | null;
    categories: Category[];
    existingCategoryIds: string[];
    onSuccess: () => void;
};

type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

export function BudgetFormModal({
    open,
    onOpenChange,
    budget,
    categories,
    existingCategoryIds,
    onSuccess,
}: BudgetFormProps) {
    const isEditing = !!budget;
    const { showSuccess, showError } = useFormToast();

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(BudgetFormSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            month: budget?.month ? convertFromUTC(budget.month) : new Date(),
            categoryId: budget?.categoryId || '',
            monthlyLimit: budget?.monthlyLimit || 0,
        },
    });

    const onSubmit = async (data: BudgetFormValues) => {
        try {
            if (isEditing) {
                const result = await updateBudget({
                    id: budget.id,
                    monthlyLimit: data.monthlyLimit,
                });

                if (result.success) {
                    showSuccess('Budget updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    showError(getSupabaseErrorMessage(result.error) || 'Failed to update budget');
                }
            } else {
                const result = await createBudget({
                    categoryId: data.categoryId,
                    monthlyLimit: data.monthlyLimit,
                    month: formatMonthForDB(data.month),
                });

                if (result.success) {
                    showSuccess('Budget created successfully');
                    onSuccess();
                    onOpenChange(false);
                    form.reset();
                } else {
                    showError(getSupabaseErrorMessage(result.error) || 'Failed to create budget');
                }
            }
        } catch (error) {
            showError('An unexpected error occurred');
        }
    };

    const availableCategories = categories.filter(
        (c) => !existingCategoryIds.includes(c.id) || c.id === budget?.categoryId
    );

    const formErrors = Object.entries(form.formState.errors).map(([field, error]) => ({
        field,
        label: field === 'month' ? 'Month' :
            field === 'categoryId' ? 'Category' : 'Monthly Limit',
        message: error?.message || 'Invalid value',
    }));

    const handleErrorClick = (fieldName: string) => {
        const element = document.getElementById(fieldName);
        element?.focus();
    };

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

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormErrorSummary
                            errors={formErrors}
                            onErrorClick={handleErrorClick}
                        />

                        {!isEditing && (
                            <FormField
                                control={form.control}
                                name="month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Month</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={form.formState.isSubmitting}
                                                error={!!form.formState.errors.month}
                                                id="month"
                                                ariaLabel="Budget month"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isEditing || form.formState.isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger id="categoryId">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="monthlyLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monthly Limit</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            id="monthlyLimit"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            value={field.value || ''}
                                            disabled={form.formState.isSubmitting}
                                            aria-invalid={!!form.formState.errors.monthlyLimit}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={form.formState.isSubmitting}
                            >
                                Cancel
                            </Button>
                            <LoadingButton
                                type="submit"
                                loading={form.formState.isSubmitting}
                                loadingText="Saving..."
                            >
                                {isEditing ? 'Update' : 'Create'}
                            </LoadingButton>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
