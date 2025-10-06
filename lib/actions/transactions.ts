'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
    ActionResult,
    Transaction,
    TransactionWithCategory,
} from '@/types';
import {
    createTransactionSchema,
    updateTransactionSchema,
    getTransactionsSchema,
} from '@/lib/schemas/transactions';

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all transactions with optional filtering
 */
export async function getTransactions(
    input?: z.infer<typeof getTransactionsSchema>
): Promise<
    ActionResult<{
        transactions: TransactionWithCategory[];
        total: number;
        summary: {
            totalCredits: number;
            totalDebits: number;
            netAmount: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = input ? getTransactionsSchema.parse(input) : {};
        const {
            month,
            categoryId,
            type,
            limit = 50,
            offset = 0,
            sortBy = 'date',
            sortOrder = 'desc',
        } = validated;

        const supabase = await createClient();

        let query = supabase
            .from('transactions')
            .select(
                `
        *,
        category:categories(id, name, color, icon)
      `,
                { count: 'exact' }
            )
            .eq('user_id', userId);

        // Apply filters
        if (month) {
            const [year, monthNum] = month.split('-');
            const startDate = `${year}-${monthNum}-01`;
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
                .toISOString()
                .split('T')[0];
            query = query.gte('date', startDate).lte('date', endDate);
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (type) {
            query = query.eq('type', type);
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            return { success: false, error: error.message };
        }

        // Calculate summary
        const summary = {
            totalCredits: data
                .filter((t) => t.type === 'credit')
                .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
            totalDebits: data
                .filter((t) => t.type === 'debit')
                .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
            netAmount: 0,
        };
        summary.netAmount = summary.totalCredits - summary.totalDebits;

        return {
            success: true,
            data: {
                transactions: data as unknown as TransactionWithCategory[],
                total: count || 0,
                summary,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to fetch transactions',
        };
    }
}

/**
 * Get single transaction by ID
 */
export async function getTransaction(
    id: string
): Promise<ActionResult<TransactionWithCategory>> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .select(
                `
        *,
        category:categories(id, name, color, icon)
      `
            )
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Transaction not found' };
            }
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data: data as unknown as TransactionWithCategory,
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch transaction',
        };
    }
}

/**
 * Create new transaction
 */
export async function createTransaction(
    input: z.infer<typeof createTransactionSchema>
): Promise<ActionResult<Transaction>> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = createTransactionSchema.parse(input);

        // Verify category exists and user has access
        if (validated.categoryId) {
            const supabase = await createClient();
            const { data: category } = await supabase
                .from('categories')
                .select('id, user_id, type')
                .eq('id', validated.categoryId)
                .single();

            if (
                !category ||
                (category.type === 'custom' && category.user_id !== userId)
            ) {
                return { success: false, error: 'Category not found' };
            }
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                date: validated.date,
                description: validated.description,
                amount: validated.amount,
                type: validated.type,
                category_id: validated.categoryId || null,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/transactions');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: data as Transaction,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to create transaction',
        };
    }
}

/**
 * Update existing transaction
 */
export async function updateTransaction(
    input: z.infer<typeof updateTransactionSchema>
): Promise<ActionResult<Transaction>> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = updateTransactionSchema.parse(input);
        const { id, ...updates } = validated;

        // Verify transaction exists and belongs to user
        const supabase = await createClient();
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Transaction not found' };
        }

        // Verify category if provided
        if (updates.categoryId !== undefined && updates.categoryId !== null) {
            const { data: category } = await supabase
                .from('categories')
                .select('id, user_id, type')
                .eq('id', updates.categoryId)
                .single();

            if (
                !category ||
                (category.type === 'custom' && category.user_id !== userId)
            ) {
                return { success: false, error: 'Category not found' };
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .update({
                ...(updates.date && { date: updates.date }),
                ...(updates.description && { description: updates.description }),
                ...(updates.amount !== undefined && { amount: updates.amount }),
                ...(updates.type && { type: updates.type }),
                ...(updates.categoryId !== undefined && {
                    category_id: updates.categoryId === null ? null : updates.categoryId,
                }),
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/transactions');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: data as Transaction,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to update transaction',
        };
    }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(id: string): Promise<ActionResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/transactions');
        revalidatePath('/dashboard');

        return { success: true, data: undefined };
    } catch {
        return {
            success: false,
            error: 'Failed to delete transaction',
        };
    }
}

/**
 * Bulk create transactions (for PDF import)
 */
export async function bulkCreateTransactions(input: {
    transactions: Array<z.infer<typeof createTransactionSchema>>;
    importId?: string;
}): Promise<ActionResult<{ created: number; transactionIds: string[] }>> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        if (input.transactions.length > 1000) {
            return { success: false, error: 'Batch size exceeds limit of 1000' };
        }

        // Validate all transactions
        const validated = input.transactions.map((t) =>
            createTransactionSchema.parse(t)
        );

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .insert(
                validated.map((t) => ({
                    user_id: userId,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    category_id: t.categoryId || null,
                    import_id: input.importId || null,
                }))
            )
            .select('id');

        if (error) {
            return { success: false, error: error.message };
        }

        // Update import status if provided
        if (input.importId) {
            await supabase
                .from('statement_imports')
                .update({ status: 'confirmed', transaction_count: data.length })
                .eq('id', input.importId)
                .eq('user_id', userId);
        }

        revalidatePath('/dashboard/transactions');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                created: data.length,
                transactionIds: data.map((t) => t.id),
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to create transactions',
        };
    }
}

/**
 * Get monthly totals for a specific month
 */
export async function getMonthlyTotals(month: string): Promise<
    ActionResult<{
        month: string;
        totalCredits: number;
        totalDebits: number;
        netAmount: number;
        transactionCount: number;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return { success: false, error: 'Month must be in format YYYY-MM' };
        }

        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
            .toISOString()
            .split('T')[0];

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('type, amount')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) {
            return { success: false, error: error.message };
        }

        const totalCredits = data
            .filter((t) => t.type === 'credit')
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const totalDebits = data
            .filter((t) => t.type === 'debit')
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        return {
            success: true,
            data: {
                month,
                totalCredits,
                totalDebits,
                netAmount: totalCredits - totalDebits,
                transactionCount: data.length,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch monthly totals',
        };
    }
}

/**
 * Get trend data over a specified period
 */
export async function getTrendData(input: {
    months?: number; // 3, 6, or 12
    startMonth?: string; // Custom range start (YYYY-MM)
    endMonth?: string; // Custom range end (YYYY-MM)
}): Promise<
    ActionResult<
        Array<{
            month: string;
            totalCredits: number;
            totalDebits: number;
            netAmount: number;
        }>
    >
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        let startDate: string;
        let endDate: string;

        if (input.startMonth && input.endMonth) {
            // Custom range
            if (
                !/^\d{4}-\d{2}$/.test(input.startMonth) ||
                !/^\d{4}-\d{2}$/.test(input.endMonth)
            ) {
                return { success: false, error: 'Dates must be in format YYYY-MM' };
            }
            startDate = `${input.startMonth}-01`;
            const [year, month] = input.endMonth.split('-');
            endDate = new Date(parseInt(year), parseInt(month), 0)
                .toISOString()
                .split('T')[0];
        } else {
            // Preset months (default 3)
            const months = input.months && [3, 6, 12].includes(input.months) ? input.months : 3;
            const now = new Date();
            const startMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
            startDate = startMonth.toISOString().split('T')[0];
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                .toISOString()
                .split('T')[0];
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('date, type, amount')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        // Group by month
        const monthlyData = new Map<
            string,
            { credits: number; debits: number }
        >();

        data.forEach((t) => {
            const month = t.date.substring(0, 7); // YYYY-MM
            if (!monthlyData.has(month)) {
                monthlyData.set(month, { credits: 0, debits: 0 });
            }
            const monthData = monthlyData.get(month)!;
            const amount = parseFloat(t.amount.toString());
            if (t.type === 'credit') {
                monthData.credits += amount;
            } else {
                monthData.debits += amount;
            }
        });

        // Convert to array and fill missing months with zeros
        const result: Array<{
            month: string;
            totalCredits: number;
            totalDebits: number;
            netAmount: number;
        }> = [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);

        while (current <= end) {
            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            const monthData = monthlyData.get(monthKey) || { credits: 0, debits: 0 };
            result.push({
                month: monthKey,
                totalCredits: monthData.credits,
                totalDebits: monthData.debits,
                netAmount: monthData.credits - monthData.debits,
            });
            current.setMonth(current.getMonth() + 1);
        }

        return {
            success: true,
            data: result,
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch trend data',
        };
    }
}
