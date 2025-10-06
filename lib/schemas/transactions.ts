import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Transactions
// ============================================================================

export const createTransactionSchema = z.object({
    date: z.string().refine((date) => {
        const d = new Date(date);
        return !isNaN(d.getTime()) && d <= new Date();
    }, 'Date must be valid and not in the future'),
    description: z
        .string()
        .trim()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),
    amount: z
        .number()
        .positive('Amount must be positive')
        .refine((n) => Number.isFinite(n) && n < 1000000000000, 'Amount too large')
        .refine(
            (n) => Number((n * 100).toFixed(0)) / 100 === n,
            'Amount can have at most 2 decimal places'
        ),
    type: z.enum(['credit', 'debit'], {
        message: "Type must be 'credit' or 'debit'",
    }),
    categoryId: z.string().uuid().optional().nullable(),
});

export const updateTransactionSchema = z
    .object({
        id: z.string().uuid(),
        date: z
            .string()
            .refine((date) => {
                const d = new Date(date);
                return !isNaN(d.getTime()) && d <= new Date();
            }, 'Date must be valid and not in the future')
            .optional(),
        description: z
            .string()
            .trim()
            .min(1, 'Description is required')
            .max(500, 'Description must be less than 500 characters')
            .optional(),
        amount: z
            .number()
            .positive('Amount must be positive')
            .refine((n) => Number.isFinite(n) && n < 1000000000000, 'Amount too large')
            .refine(
                (n) => Number((n * 100).toFixed(0)) / 100 === n,
                'Amount can have at most 2 decimal places'
            )
            .optional(),
        type: z
            .enum(['credit', 'debit'], {
                message: "Type must be 'credit' or 'debit'",
            })
            .optional(),
        categoryId: z.string().uuid().nullable().optional(),
    })
    .refine((data) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...rest } = data;
        return Object.keys(rest).length > 0;
    }, 'At least one field must be provided for update');

export const getTransactionsSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['credit', 'debit']).optional(),
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
    sortBy: z.enum(['date', 'amount', 'description']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});
