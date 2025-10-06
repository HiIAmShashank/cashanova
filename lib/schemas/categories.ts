import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Categories
// ============================================================================

export const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
    icon: z.string().optional(),
});

export const updateCategorySchema = z
    .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().nullable().optional(),
    })
    .refine((data) => {
        return data.name || data.color || data.icon !== undefined;
    }, 'At least one field must be provided for update');

export const deleteCategorySchema = z.object({
    id: z.string().uuid(),
    reassignTo: z.string().uuid().optional(),
});

export const getCategoryUsageReportSchema = z
    .object({
        categoryId: z.string().uuid(),
        startMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
        endMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    })
    .refine((data) => {
        if (data.startMonth && data.endMonth) {
            return data.startMonth <= data.endMonth;
        }
        return true;
    }, 'startMonth must be before or equal to endMonth');

export const suggestCategorySchema = z.object({
    description: z.string().trim().min(1).max(500),
    amount: z.number().positive().multipleOf(0.01).optional(),
});
