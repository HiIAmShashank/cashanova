'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';
import {
    createCategorySchema,
    updateCategorySchema,
    deleteCategorySchema,
    getCategoryUsageReportSchema,
    suggestCategorySchema,
} from '@/lib/schemas/categories';

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
 * Get all categories (system + custom) for current user
 */
export async function getCategories(input?: {
    includeSystem?: boolean;
    includeUsage?: boolean;
}): Promise<
    ActionResult<{
        categories: Array<{
            id: string;
            name: string;
            color: string;
            icon?: string;
            isSystem: boolean;
            createdAt: string;
            transactionCount?: number;
            totalAmount?: number;
        }>;
        summary: {
            totalCategories: number;
            systemCategories: number;
            customCategories: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const includeSystem = input?.includeSystem ?? true;
        const includeUsage = input?.includeUsage ?? false;

        const supabase = await createClient();

        let query = supabase.from('categories').select('*');

        if (includeSystem) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        } else {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            return { success: false, error: error.message };
        }

        // Get usage data if requested
        const usageMap = new Map<
            string,
            { count: number; total: number }
        >();

        if (includeUsage) {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('category_id, amount')
                .eq('user_id', userId)
                .not('category_id', 'is', null);

            (transactions || []).forEach((t) => {
                if (!t.category_id) return;
                const existing = usageMap.get(t.category_id) || {
                    count: 0,
                    total: 0,
                };
                existing.count += 1;
                existing.total += parseFloat(t.amount.toString());
                usageMap.set(t.category_id, existing);
            });
        }

        const categories = data.map((cat) => {
            const usage = usageMap.get(cat.id);
            return {
                id: cat.id,
                name: cat.name,
                color: cat.color,
                icon: cat.icon || undefined,
                isSystem: cat.type === 'system',
                createdAt: cat.created_at,
                transactionCount: usage?.count,
                totalAmount: usage?.total,
            };
        });

        const summary = {
            totalCategories: categories.length,
            systemCategories: categories.filter((c) => c.isSystem).length,
            customCategories: categories.filter((c) => !c.isSystem).length,
        };

        return {
            success: true,
            data: {
                categories,
                summary,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch categories',
        };
    }
}

/**
 * Get single category by ID
 */
export async function getCategory(id: string): Promise<
    ActionResult<{
        id: string;
        name: string;
        color: string;
        icon?: string;
        isSystem: boolean;
        createdAt: string;
        usage: {
            transactionCount: number;
            totalAmount: number;
            lastUsed?: string;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (categoryError) {
            if (categoryError.code === 'PGRST116') {
                return { success: false, error: 'Category not found' };
            }
            return { success: false, error: categoryError.message };
        }

        // Check access
        if (category.type === 'custom' && category.user_id !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get usage data
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, date')
            .eq('user_id', userId)
            .eq('category_id', id)
            .order('date', { ascending: false });

        const usage = {
            transactionCount: transactions?.length || 0,
            totalAmount: (transactions || []).reduce(
                (sum, t) => sum + parseFloat(t.amount.toString()),
                0
            ),
            lastUsed: transactions && transactions.length > 0 ? transactions[0].date : undefined,
        };

        return {
            success: true,
            data: {
                id: category.id,
                name: category.name,
                color: category.color,
                icon: category.icon || undefined,
                isSystem: category.type === 'system',
                createdAt: category.created_at,
                usage,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch category',
        };
    }
}

/**
 * Create custom category
 */
export async function createCategory(
    input: z.infer<typeof createCategorySchema>
): Promise<
    ActionResult<{
        id: string;
        name: string;
        color: string;
        icon?: string;
        isSystem: false;
        createdAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = createCategorySchema.parse(input);

        const supabase = await createClient();

        // Check for duplicate name
        const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', userId)
            .eq('name', validated.name)
            .single();

        if (existing) {
            return {
                success: false,
                error: 'Category name already exists',
            };
        }

        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: userId,
                name: validated.name,
                color: validated.color,
                icon: validated.icon || null,
                type: 'custom',
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/categories');
        revalidatePath('/dashboard/transactions');

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                color: data.color,
                icon: data.icon || undefined,
                isSystem: false,
                createdAt: data.created_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to create category',
        };
    }
}

/**
 * Update custom category
 */
export async function updateCategory(
    input: z.infer<typeof updateCategorySchema>
): Promise<
    ActionResult<{
        id: string;
        name: string;
        color: string;
        icon?: string;
        updatedAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = updateCategorySchema.parse(input);
        const { id, ...updates } = validated;

        const supabase = await createClient();

        // Verify category exists and is custom
        const { data: existing } = await supabase
            .from('categories')
            .select('type, user_id')
            .eq('id', id)
            .single();

        if (!existing) {
            return { success: false, error: 'Category not found' };
        }

        if (existing.type === 'system') {
            return { success: false, error: 'Cannot edit system category' };
        }

        if (existing.user_id !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check for duplicate name if updating name
        if (updates.name) {
            const { data: duplicate } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', userId)
                .eq('name', updates.name)
                .neq('id', id)
                .single();

            if (duplicate) {
                return {
                    success: false,
                    error: 'Category name already exists',
                };
            }
        }

        const { data, error } = await supabase
            .from('categories')
            .update({
                name: updates.name,
                color: updates.color,
                icon: updates.icon === null ? null : updates.icon || undefined,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/categories');
        revalidatePath('/dashboard/transactions');

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                color: data.color,
                icon: data.icon || undefined,
                updatedAt: data.updated_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to update category',
        };
    }
}

/**
 * Delete custom category
 */
export async function deleteCategory(
    input: z.infer<typeof deleteCategorySchema>
): Promise<
    ActionResult<{
        deletedCategoryId: string;
        reassignedTo?: string;
        transactionsAffected: number;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = deleteCategorySchema.parse(input);

        const supabase = await createClient();

        // Verify category exists and is custom
        const { data: existing } = await supabase
            .from('categories')
            .select('type, user_id')
            .eq('id', validated.id)
            .single();

        if (!existing) {
            return { success: false, error: 'Category not found' };
        }

        if (existing.type === 'system') {
            return { success: false, error: 'Cannot delete system category' };
        }

        if (existing.user_id !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check for transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('category_id', validated.id);

        const transactionsAffected = transactions?.length || 0;

        if (transactionsAffected > 0 && !validated.reassignTo) {
            return {
                success: false,
                error: 'Category in use. Provide reassignTo to proceed',
            };
        }

        // If reassignTo provided, verify it exists
        if (validated.reassignTo) {
            const { data: targetCategory } = await supabase
                .from('categories')
                .select('id, user_id, type')
                .eq('id', validated.reassignTo)
                .single();

            if (
                !targetCategory ||
                (targetCategory.type === 'custom' &&
                    targetCategory.user_id !== userId)
            ) {
                return { success: false, error: 'Reassignment target not found' };
            }

            // Reassign transactions
            await supabase
                .from('transactions')
                .update({ category_id: validated.reassignTo })
                .eq('user_id', userId)
                .eq('category_id', validated.id);
        }

        // Delete category
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', validated.id)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/categories');
        revalidatePath('/dashboard/transactions');

        return {
            success: true,
            data: {
                deletedCategoryId: validated.id,
                reassignedTo: validated.reassignTo,
                transactionsAffected,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to delete category',
        };
    }
}

/**
 * Get system categories
 */
export async function getSystemCategories(): Promise<
    ActionResult<{
        categories: Array<{
            id: string;
            name: string;
            color: string;
            icon?: string;
            isSystem: true;
        }>;
    }>
> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('type', 'system');

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data: {
                categories: data.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    icon: cat.icon || undefined,
                    isSystem: true as const,
                })),
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch system categories',
        };
    }
}

/**
 * Get category usage report
 */
export async function getCategoryUsageReport(
    input: z.infer<typeof getCategoryUsageReportSchema>
): Promise<
    ActionResult<{
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        period: {
            start: string;
            end: string;
        };
        overall: {
            totalTransactions: number;
            totalAmount: number;
            averageTransactionAmount: number;
        };
        monthly: Array<{
            month: string;
            transactionCount: number;
            totalAmount: number;
            percentageOfTotalSpending: number;
        }>;
        topTransactions: Array<{
            id: string;
            date: string;
            description: string;
            amount: number;
        }>;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = getCategoryUsageReportSchema.parse(input);

        const supabase = await createClient();

        // Get category
        const { data: category } = await supabase
            .from('categories')
            .select('id, name, color')
            .eq('id', validated.categoryId)
            .single();

        if (!category) {
            return { success: false, error: 'Category not found' };
        }

        // Calculate date range (default: last 6 months)
        const now = new Date();
        const defaultStart = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );
        const startMonth =
            validated.startMonth ||
            `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}`;
        const endMonth =
            validated.endMonth ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const startDate = `${startMonth}-01`;
        const [endYear, endMonthNum] = endMonth.split('-');
        const endDate = new Date(parseInt(endYear), parseInt(endMonthNum), 0)
            .toISOString()
            .split('T')[0];

        // Get transactions for this category
        const { data: categoryTransactions } = await supabase
            .from('transactions')
            .select('id, date, description, amount')
            .eq('user_id', userId)
            .eq('category_id', validated.categoryId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('amount', { ascending: false });

        // Get all transactions for percentage calculation
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('date, amount')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate);

        // Calculate overall stats
        const totalTransactions = categoryTransactions?.length || 0;
        const totalAmount = (categoryTransactions || []).reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
        );
        const averageTransactionAmount =
            totalTransactions > 0 ? totalAmount / totalTransactions : 0;

        // Group by month
        const monthlyData = new Map<
            string,
            { count: number; amount: number }
        >();
        const allMonthlySpending = new Map<string, number>();

        (categoryTransactions || []).forEach((t) => {
            const month = t.date.substring(0, 7);
            const existing = monthlyData.get(month) || { count: 0, amount: 0 };
            existing.count += 1;
            existing.amount += parseFloat(t.amount.toString());
            monthlyData.set(month, existing);
        });

        (allTransactions || []).forEach((t) => {
            const month = t.date.substring(0, 7);
            const existing = allMonthlySpending.get(month) || 0;
            allMonthlySpending.set(
                month,
                existing + parseFloat(t.amount.toString())
            );
        });

        // Build monthly array
        const monthly: Array<{
            month: string;
            transactionCount: number;
            totalAmount: number;
            percentageOfTotalSpending: number;
        }> = [];

        const start = new Date(`${startMonth}-01`);
        const end = new Date(`${endMonth}-01`);
        const current = new Date(start);

        while (current <= end) {
            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            const monthData = monthlyData.get(monthKey) || {
                count: 0,
                amount: 0,
            };
            const totalMonthSpending = allMonthlySpending.get(monthKey) || 0;
            const percentageOfTotalSpending =
                totalMonthSpending > 0
                    ? (monthData.amount / totalMonthSpending) * 100
                    : 0;

            monthly.push({
                month: monthKey,
                transactionCount: monthData.count,
                totalAmount: monthData.amount,
                percentageOfTotalSpending,
            });

            current.setMonth(current.getMonth() + 1);
        }

        // Top 10 transactions
        const topTransactions = (categoryTransactions || [])
            .slice(0, 10)
            .map((t) => ({
                id: t.id,
                date: t.date,
                description: t.description,
                amount: parseFloat(t.amount.toString()),
            }));

        return {
            success: true,
            data: {
                categoryId: validated.categoryId,
                categoryName: category.name,
                categoryColor: category.color,
                period: {
                    start: startMonth,
                    end: endMonth,
                },
                overall: {
                    totalTransactions,
                    totalAmount,
                    averageTransactionAmount,
                },
                monthly,
                topTransactions,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to fetch usage report',
        };
    }
}

/**
 * Suggest category for transaction description
 */
export async function suggestCategoryForTransaction(
    input: z.infer<typeof suggestCategorySchema>
): Promise<
    ActionResult<{
        suggestions: Array<{
            categoryId: string;
            categoryName: string;
            categoryColor: string;
            confidence: 'high' | 'medium' | 'low';
            reason: string;
        }>;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = suggestCategorySchema.parse(input);

        const supabase = await createClient();

        // Get all transactions with similar descriptions
        const { data: transactions } = await supabase
            .from('transactions')
            .select(
                `
        category_id,
        description,
        categories(id, name, color)
      `
            )
            .eq('user_id', userId)
            .not('category_id', 'is', null)
            .ilike('description', `%${validated.description}%`);

        // Count category occurrences
        const categoryCount = new Map<string, number>();
        const categoryInfo = new Map<
            string,
            { name: string; color: string }
        >();

        (transactions || []).forEach((t) => {
            if (!t.category_id || !t.categories) return;
            const count = categoryCount.get(t.category_id) || 0;
            categoryCount.set(t.category_id, count + 1);
            const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
            if (cat) {
                categoryInfo.set(t.category_id, {
                    name: cat.name as string,
                    color: cat.color as string,
                });
            }
        });

        // Build suggestions
        const suggestions = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([categoryId, count]) => {
                const info = categoryInfo.get(categoryId)!;
                const totalSimilar = transactions?.length || 0;
                const matchPercentage = totalSimilar > 0 ? count / totalSimilar : 0;

                let confidence: 'high' | 'medium' | 'low';
                let reason: string;

                if (count > 5 && matchPercentage > 0.8) {
                    confidence = 'high';
                    reason = `Used in ${count} similar transactions (${Math.round(matchPercentage * 100)}% match)`;
                } else if (count >= 2) {
                    confidence = 'medium';
                    reason = `Used in ${count} similar transactions`;
                } else {
                    confidence = 'low';
                    reason = `Used once in a similar transaction`;
                }

                return {
                    categoryId,
                    categoryName: info.name,
                    categoryColor: info.color,
                    confidence,
                    reason,
                };
            });

        return {
            success: true,
            data: {
                suggestions,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to suggest category',
        };
    }
}
