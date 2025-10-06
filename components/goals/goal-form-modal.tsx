'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/forms/date-picker';
import { LoadingButton } from '@/components/forms/loading-button';
import { FormErrorSummary } from '@/components/forms/form-error-summary';
import { useFormToast } from '@/hooks/use-form-toast';
import { GoalFormSchema, type GoalFormData } from '@/lib/schemas/goals';
import { formatDateForDB, convertFromUTC } from '@/lib/utils/form-helpers';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';
import { createGoal, updateGoal } from '@/lib/actions/goals';

type Goal = {
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount?: number;
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
    const { showSuccess, showError } = useFormToast();

    const form = useForm<GoalFormData>({
        resolver: zodResolver(GoalFormSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            targetAmount: 0,
            currentAmount: undefined,
            targetDate: undefined,
            color: DEFAULT_COLORS[0],
        },
    });

    const {
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = form;

    const selectedColor = watch('color');

    // Reset form when dialog opens/closes or goal changes
    useEffect(() => {
        if (open && goal) {
            reset({
                name: goal.name,
                description: goal.description || '',
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                targetDate: goal.targetDate ? convertFromUTC(goal.targetDate) : undefined,
                color: goal.color || DEFAULT_COLORS[0],
            });
        } else if (open && !goal) {
            reset({
                name: '',
                description: '',
                targetAmount: 0,
                currentAmount: undefined,
                targetDate: undefined,
                color: DEFAULT_COLORS[0],
            });
        }
    }, [open, goal, reset]);

    const onSubmit = async (data: GoalFormData) => {
        try {
            if (isEditing) {
                const updateData: {
                    id: string;
                    name?: string;
                    description?: string | null;
                    targetAmount?: number;
                    targetDate?: string | null;
                    color?: string;
                } = {
                    id: goal.id,
                    name: data.name,
                    description: data.description || null,
                    targetAmount: data.targetAmount,
                };

                if (data.targetDate) {
                    updateData.targetDate = formatDateForDB(data.targetDate);
                }

                if (data.color) {
                    updateData.color = data.color;
                }

                const result = await updateGoal(updateData);
                if (result.success) {
                    showSuccess('Goal updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    showError(result.error || 'Failed to update goal');
                }
            } else {
                const createData = {
                    name: data.name,
                    description: data.description,
                    targetAmount: data.targetAmount,
                    targetDate: data.targetDate ? formatDateForDB(data.targetDate) : undefined,
                    color: data.color || DEFAULT_COLORS[0],
                };

                const result = await createGoal(createData);
                if (result.success) {
                    showSuccess('Goal created successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    showError(result.error || 'Failed to create goal');
                }
            }
        } catch (error) {
            showError(getSupabaseErrorMessage(error));
        }
    };

    const formErrors = Object.entries(errors).map(([key, value]) => ({
        field: key,
        message: value?.message || 'Invalid value',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    }));

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

                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {formErrors.length > 0 && <FormErrorSummary errors={formErrors} />}

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goal Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Emergency Fund" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="What is this goal for?"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="targetAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Date (Optional)</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                minDate={new Date()}
                                                placeholder="Select date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {isEditing && (
                            <FormField
                                control={form.control}
                                name="currentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
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
                                                    aria-label={`Select ${color} color`}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <LoadingButton
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </LoadingButton>
                            <LoadingButton
                                type="submit"
                                loading={isSubmitting}
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
