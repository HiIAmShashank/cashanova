'use client';

import { useEffect } from 'react';
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
import { DatePicker } from '@/components/forms/date-picker';
import { LoadingButton } from '@/components/forms/loading-button';
import { FormErrorSummary } from '@/components/forms/form-error-summary';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import { useFormToast } from '@/hooks/use-form-toast';
import { TransactionFormSchema } from '@/lib/schemas/transactions';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';
import { formatDateForDB, convertFromUTC } from '@/lib/utils/form-helpers';
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

type TransactionFormValues = z.infer<typeof TransactionFormSchema>;

export function TransactionFormModal({
    open,
    onOpenChange,
    transaction,
    categories,
    onSuccess,
}: TransactionFormProps) {
    const isEditing = !!transaction;
    const { showSuccess, showError } = useFormToast();

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(TransactionFormSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            date: transaction?.date ? convertFromUTC(transaction.date) : new Date(),
            description: transaction?.description || '',
            amount: transaction?.amount || 0,
            type: transaction?.type || 'debit',
            categoryId: transaction?.category_id || '',
        },
    });

    useEffect(() => {
        if (transaction) {
            form.reset({
                date: convertFromUTC(transaction.date),
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                categoryId: transaction.category_id || '',
            });
        } else {
            form.reset({
                date: new Date(),
                description: '',
                amount: 0,
                type: 'debit',
                categoryId: '',
            });
        }
    }, [transaction, form]);

    const onSubmit = async (data: TransactionFormValues) => {
        try {
            const payload = {
                date: formatDateForDB(data.date),
                description: data.description,
                amount: data.amount,
                type: data.type,
                categoryId: data.categoryId || null,
            };

            if (isEditing) {
                const result = await updateTransaction({
                    id: transaction.id,
                    ...payload,
                });

                if (result.success) {
                    showSuccess('Transaction updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    showError(getSupabaseErrorMessage(result.error) || 'Failed to update transaction');
                }
            } else {
                const result = await createTransaction(payload);

                if (result.success) {
                    showSuccess('Transaction created successfully');
                    onSuccess();
                    onOpenChange(false);
                    form.reset();
                } else {
                    showError(getSupabaseErrorMessage(result.error) || 'Failed to create transaction');
                }
            }
        } catch (error) {
            showError('An unexpected error occurred');
        }
    };

    const formErrors = Object.entries(form.formState.errors).map(([field, error]) => ({
        field,
        label: field === 'date' ? 'Date' :
            field === 'description' ? 'Description' :
                field === 'amount' ? 'Amount' :
                    field === 'type' ? 'Type' : 'Category',
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
                        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the transaction details below.'
                            : 'Add a new income or expense transaction.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormErrorSummary
                            errors={formErrors}
                            onErrorClick={handleErrorClick}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                maxDate={new Date()}
                                                disabled={form.formState.isSubmitting}
                                                error={!!form.formState.errors.date}
                                                id="date"
                                                ariaLabel="Transaction date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={form.formState.isSubmitting}
                                        >
                                            <FormControl>
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="credit">Income</SelectItem>
                                                <SelectItem value="debit">Expense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            id="description"
                                            placeholder="e.g., Grocery shopping"
                                            disabled={form.formState.isSubmitting}
                                            aria-invalid={!!form.formState.errors.description}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            value={field.value || ''}
                                            disabled={form.formState.isSubmitting}
                                            aria-invalid={!!form.formState.errors.amount}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category (Optional)</FormLabel>
                                    <Select
                                        value={field.value || 'none'}
                                        onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                                        disabled={form.formState.isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger id="categoryId">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
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
