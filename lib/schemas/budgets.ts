import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Budgets
// ============================================================================

export const createBudgetSchema = z.object({
    categoryId: z.string().uuid(),
    monthlyLimit: z.number().positive().multipleOf(0.01),
    month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Full date format YYYY-MM-DD
});

export const updateBudgetSchema = z.object({
    id: z.string().uuid(),
    monthlyLimit: z.number().positive().multipleOf(0.01),
});

export const getBudgetsSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(), // Accept both YYYY-MM and YYYY-MM-DD
});

export const getBudgetHistorySchema = z
    .object({
        categoryId: z.string().uuid(),
        startMonth: z.string().regex(/^\d{4}-\d{2}$/),
        endMonth: z.string().regex(/^\d{4}-\d{2}$/),
    })
    .refine(
        (data) => data.startMonth <= data.endMonth,
        'startMonth must be before or equal to endMonth'
    );

export const calculateBudgetRecommendationsSchema = z.object({
    lookbackMonths: z.number().int().min(1).max(12).default(3),
});
