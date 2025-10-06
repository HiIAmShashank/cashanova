import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Import
// ============================================================================

export const uploadStatementSchema = z.object({
    bankName: z.string().trim().max(50).optional(),
});

export const parseStatementSchema = z.object({
    importId: z.string().uuid(),
});

export const getImportSchema = z.object({
    importId: z.string().uuid(),
});

export const updateParsedTransactionSchema = z
    .object({
        importId: z.string().uuid(),
        tempId: z.string().uuid(),
        description: z.string().trim().min(1).max(500).optional(),
        amount: z.number().positive().multipleOf(0.01).optional(),
        type: z.enum(['credit', 'debit']).optional(),
        categoryId: z.string().uuid().nullable().optional(),
        isSelected: z.boolean().optional(),
    })
    .refine((data) => {
        return (
            data.description ||
            data.amount ||
            data.type ||
            data.categoryId !== undefined ||
            data.isSelected !== undefined
        );
    }, 'At least one field must be provided for update');

export const confirmImportSchema = z.object({
    importId: z.string().uuid(),
    selectedTempIds: z.array(z.string().uuid()).optional(),
});

export const getImportsSchema = z.object({
    status: z.enum(['uploaded', 'parsed', 'confirmed', 'failed', 'all']).default('all'),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
});

export const deleteImportSchema = z.object({
    importId: z.string().uuid(),
    deleteTransactions: z.boolean().default(false),
});

export const retryParseSchema = z.object({
    importId: z.string().uuid(),
    bankName: z.string().trim().max(50).optional(),
});
