'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

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
 * Import transactions from CSV (client-parsed)
 */
export async function importTransactions(
    transactions: Array<{
        date: string;
        description: string;
        amount: number;
        type: 'credit' | 'debit';
        categoryId?: string | null;
    }>
): Promise<
    ActionResult<{
        createdCount: number;
        transactionIds: string[];
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        if (transactions.length === 0) {
            return { success: false, error: 'No transactions to import' };
        }

        const supabase = await createClient();

        // Create transaction records
        const transactionRecords = transactions.map((t) => ({
            user_id: userId,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category_id: t.categoryId || null,
        }));

        const { data: createdData, error: createError } = await supabase
            .from('transactions')
            .insert(transactionRecords)
            .select('id');

        if (createError) {
            return { success: false, error: createError.message };
        }

        revalidatePath('/dashboard/transactions');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                createdCount: transactions.length,
                transactionIds: createdData?.map((t) => t.id) || [],
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to import transactions',
        };
    }
}
