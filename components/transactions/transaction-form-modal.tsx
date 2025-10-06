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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import type { TransactionWithCategory } from '@/types';

type Category = {
    id: string;
    name: string;
    color: string;
};

type TransactionFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction?: TransactionWithCategory | null;
    categories: Category[];
    onSuccess: () => void;
};

const formSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    description: z.string().min(1, 'Description is required').max(500),
    amount: z.string().min(1, 'Amount is required'),
    type: z.enum(['credit', 'debit']),
    categoryId: z.string().optional(),
});

export function TransactionFormModal({
    open,
    onOpenChange,
    transaction,
    categories,
    onSuccess,
}: TransactionFormProps) {
    const isEditing = !!transaction;
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
            date: transaction?.date || new Date().toISOString().split('T')[0],
            description: transaction?.description || '',
            amount: transaction?.amount.toString() || '',
            type: transaction?.type || 'debit',
            categoryId: transaction?.category_id || undefined,
        },
    });

    const selectedType = watch('type');
    const selectedCategoryId = watch('categoryId');

    useEffect(() => {
        if (transaction) {
            reset({
                date: transaction.date,
                description: transaction.description,
                amount: transaction.amount.toString(),
                type: transaction.type,
                categoryId: transaction.category_id || undefined,
            });
        } else {
            reset({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: '',
                type: 'debit',
                categoryId: undefined,
            });
        }
    }, [transaction, reset]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            const amount = parseFloat(data.amount);

            if (isEditing) {
                const result = await updateTransaction({
                    id: transaction.id,
                    date: data.date,
                    description: data.description,
                    amount,
                    type: data.type,
                    categoryId: data.categoryId || null,
                });

                if (result.success) {
                    toast.success('Transaction updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || 'Failed to update transaction');
                }
            } else {
                const result = await createTransaction({
                    date: data.date,
                    description: data.description,
                    amount,
                    type: data.type,
                    categoryId: data.categoryId || null,
                });

                if (result.success) {
                    toast.success('Transaction created successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to create transaction');
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
                    <DialogTitle>
                        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the transaction details below.'
                            : 'Add a new income or expense transaction.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                {...register('date')}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {errors.date && (
                                <p className="text-sm text-destructive">
                                    {errors.date.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) =>
                                    setValue('type', value as 'credit' | 'debit')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">Income</SelectItem>
                                    <SelectItem value="debit">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-destructive">
                                    {errors.type.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="e.g., Grocery shopping"
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register('amount')}
                        />
                        {errors.amount && (
                            <p className="text-sm text-destructive">
                                {errors.amount.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category (Optional)</Label>
                        <Select
                            value={selectedCategoryId || 'none'}
                            onValueChange={(value) =>
                                setValue('categoryId', value === 'none' ? undefined : value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {categories.map((category) => (
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
