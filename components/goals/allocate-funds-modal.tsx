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
import { allocateFunds, deallocateFunds } from '@/lib/actions/goals';
import { toast } from 'sonner';

type AllocateFundsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goalId: string;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    mode: 'allocate' | 'deallocate';
    onSuccess: () => void;
};

const formSchema = z.object({
    amount: z.string().min(1, 'Amount is required'),
    note: z.string().max(500).optional(),
});

export function AllocateFundsModal({
    open,
    onOpenChange,
    goalId,
    goalName,
    currentAmount,
    targetAmount,
    mode,
    onSuccess,
}: AllocateFundsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            note: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            const amount = parseFloat(data.amount);

            // Validation
            if (mode === 'deallocate' && amount > currentAmount) {
                toast.error(`Cannot deallocate more than current amount ($${currentAmount.toFixed(2)})`);
                setIsSubmitting(false);
                return;
            }

            if (mode === 'allocate') {
                const result = await allocateFunds({
                    goalId,
                    amount,
                    note: data.note,
                });

                if (result.success) {
                    toast.success('Funds allocated successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to allocate funds');
                }
            } else {
                const result = await deallocateFunds({
                    goalId,
                    amount,
                    note: data.note,
                });

                if (result.success) {
                    toast.success('Funds deallocated successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to deallocate funds');
                }
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const remaining = targetAmount - currentAmount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'allocate' ? 'Allocate Funds' : 'Deallocate Funds'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'allocate'
                            ? `Add money to "${goalName}"`
                            : `Remove money from "${goalName}"`}
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4 rounded-lg bg-muted p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Amount</span>
                        <span className="font-medium">${currentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Amount</span>
                        <span className="font-medium">${targetAmount.toFixed(2)}</span>
                    </div>
                    {mode === 'allocate' && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-medium text-primary">
                                ${remaining.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={mode === 'deallocate' ? currentAmount : undefined}
                            placeholder="0.00"
                            {...register('amount')}
                            autoFocus
                        />
                        {errors.amount && (
                            <p className="text-sm text-destructive">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Input
                            id="note"
                            placeholder="e.g., Monthly contribution"
                            {...register('note')}
                        />
                        {errors.note && (
                            <p className="text-sm text-destructive">{errors.note.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                reset();
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Processing...'
                                : mode === 'allocate'
                                    ? 'Allocate'
                                    : 'Deallocate'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
