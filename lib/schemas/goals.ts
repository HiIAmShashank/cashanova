import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Goals
// ============================================================================

export const createGoalSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    targetAmount: z.number().positive().multipleOf(0.01),
    targetDate: z
        .string()
        .refine((date) => {
            const d = new Date(date);
            return !isNaN(d.getTime()) && d > new Date();
        }, 'Target date must be in the future')
        .optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
    icon: z.string().optional(),
});

export const updateGoalSchema = z
    .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().max(500).nullable().optional(),
        targetAmount: z.number().positive().multipleOf(0.01).optional(),
        targetDate: z.string().nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().nullable().optional(),
    })
    .refine(
        (data) => {
            return (
                data.name ||
                data.description !== undefined ||
                data.targetAmount ||
                data.targetDate !== undefined ||
                data.color ||
                data.icon !== undefined
            );
        },
        'At least one field must be provided for update'
    );

export const allocateFundsSchema = z.object({
    goalId: z.string().uuid(),
    amount: z.number().positive().multipleOf(0.01),
    note: z.string().trim().max(200).optional(),
});

export const deallocateFundsSchema = z.object({
    goalId: z.string().uuid(),
    amount: z.number().positive().multipleOf(0.01),
    note: z.string().trim().max(200).optional(),
});

export const getGoalsSchema = z.object({
    status: z.enum(['active', 'completed', 'all']).default('active'),
    sortBy: z
        .enum(['target_date', 'created_at', 'progress'])
        .default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Form schema for React Hook Form with Date type
export const GoalFormSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'Goal name is required')
        .max(100, 'Goal name must be less than 100 characters'),
    targetAmount: z.number()
        .positive('Target amount must be greater than zero'),
    currentAmount: z.number()
        .nonnegative('Current amount cannot be negative')
        .optional(),
    targetDate: z.date()
        .refine((date) => date > new Date(), 'Target date must be in the future')
        .optional(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
        .optional(),
}).refine((data) => {
    if (data.currentAmount !== undefined && data.targetAmount) {
        return data.currentAmount <= data.targetAmount;
    }
    return true;
}, {
    message: 'Current amount cannot exceed target amount',
    path: ['currentAmount'],
});

export type GoalFormData = z.infer<typeof GoalFormSchema>;

