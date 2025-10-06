'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';
import {
    createBudgetSchema,
    updateBudgetSchema,
    getBudgetsSchema,
    getBudgetHistorySchema,
    calculateBudgetRecommendationsSchema,
} from '@/lib/schemas/budgets';

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

function getBudgetStatus(
    percentageUsed: number
): 'on_track' | 'warning' | 'exceeded' {
    if (percentageUsed > 100) return 'exceeded';
    if (percentageUsed >= 80) return 'warning';
    return 'on_track';
}

function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`; // Always use first day of month for DATE column
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all budgets for current user with usage
 */
export async function getBudgets(
    input?: z.infer<typeof getBudgetsSchema>
): Promise<
    ActionResult<{
        month: string;
        budgets: Array<{
            id: string;
            categoryId: string;
            categoryName: string;
            categoryColor: string;
            monthlyLimit: number;
            currentSpending: number;
            remainingAmount: number;
            percentageUsed: number;
            status: 'on_track' | 'warning' | 'exceeded';
            createdAt: string;
            updatedAt: string;
        }>;
        summary: {
            totalBudgeted: number;
            totalSpent: number;
            totalRemaining: number;
            overallPercentage: number;
            categoriesExceeded: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = input ? getBudgetsSchema.parse(input) : {};
        let month = validated.month || getCurrentMonth();

        // Convert YYYY-MM to YYYY-MM-01 if needed (for DATE column compatibility)
        if (month && month.length === 7) {
            month = `${month}-01`;
        }

        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
            .toISOString()
            .split('T')[0];

        const supabase = await createClient();

        // Get budgets with category info for the specified month
        const { data: budgets, error: budgetsError } = await supabase
            .from('budgets')
            .select(
                `
        *,
        category:categories(id, name, color)
      `
            )
            .eq('user_id', userId)
            .eq('month', month);

        if (budgetsError) {
            return { success: false, error: budgetsError.message };
        }

        // Get transactions for the month
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('category_id, amount')
            .eq('user_id', userId)
            .eq('type', 'debit')
            .gte('date', startDate)
            .lte('date', endDate);

        if (transactionsError) {
            return { success: false, error: transactionsError.message };
        }

        // Calculate spending per category
        const spendingByCategory = new Map<string, number>();
        transactions.forEach((t) => {
            if (t.category_id) {
                const current = spendingByCategory.get(t.category_id) || 0;
                spendingByCategory.set(
                    t.category_id,
                    current + parseFloat(t.amount.toString())
                );
            }
        });

        // Build budget data
        const budgetData = budgets.map((budget) => {
            const monthlyLimit = parseFloat(budget.monthly_limit.toString());
            const currentSpending = spendingByCategory.get(budget.category_id) || 0;
            const remainingAmount = monthlyLimit - currentSpending;
            const percentageUsed =
                monthlyLimit > 0 ? (currentSpending / monthlyLimit) * 100 : 0;
            const status = getBudgetStatus(percentageUsed);

            return {
                id: budget.id,
                categoryId: budget.category_id,
                categoryName: (budget.category as { name: string; color: string }).name,
                categoryColor: (budget.category as { name: string; color: string }).color,
                monthlyLimit,
                currentSpending,
                remainingAmount,
                percentageUsed,
                status,
                createdAt: budget.created_at,
                updatedAt: budget.updated_at,
            };
        });

        // Calculate summary
        const summary = {
            totalBudgeted: budgetData.reduce((sum, b) => sum + b.monthlyLimit, 0),
            totalSpent: budgetData.reduce((sum, b) => sum + b.currentSpending, 0),
            totalRemaining: budgetData.reduce((sum, b) => sum + b.remainingAmount, 0),
            overallPercentage: 0,
            categoriesExceeded: budgetData.filter((b) => b.status === 'exceeded')
                .length,
        };

        if (summary.totalBudgeted > 0) {
            summary.overallPercentage =
                (summary.totalSpent / summary.totalBudgeted) * 100;
        }

        return {
            success: true,
            data: {
                month,
                budgets: budgetData,
                summary,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to fetch budgets',
        };
    }
}

/**
 * Get single budget by ID with details
 */
export async function getBudget(input: {
    id: string;
    month?: string;
}): Promise<
    ActionResult<{
        id: string;
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        monthlyLimit: number;
        month: string;
        currentSpending: number;
        remainingAmount: number;
        percentageUsed: number;
        status: 'on_track' | 'warning' | 'exceeded';
        dailyAverage: number;
        projectedTotal: number;
        recentTransactions: Array<{
            id: string;
            date: string;
            description: string;
            amount: number;
        }>;
        createdAt: string;
        updatedAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const month = input.month || getCurrentMonth();
        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
            .toISOString()
            .split('T')[0];
        const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        const dayOfMonth = new Date().getDate();

        const supabase = await createClient();

        const { data: budget, error: budgetError } = await supabase
            .from('budgets')
            .select(
                `
        *,
        category:categories(id, name, color)
      `
            )
            .eq('id', input.id)
            .eq('user_id', userId)
            .single();

        if (budgetError) {
            if (budgetError.code === 'PGRST116') {
                return { success: false, error: 'Budget not found' };
            }
            return { success: false, error: budgetError.message };
        }

        // Get spending and recent transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, date, description, amount')
            .eq('user_id', userId)
            .eq('category_id', budget.category_id)
            .eq('type', 'debit')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false })
            .limit(5);

        const currentSpending = (transactions || []).reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
        );
        const monthlyLimit = parseFloat(budget.monthly_limit.toString());
        const remainingAmount = monthlyLimit - currentSpending;
        const percentageUsed =
            monthlyLimit > 0 ? (currentSpending / monthlyLimit) * 100 : 0;
        const status = getBudgetStatus(percentageUsed);
        const dailyAverage = dayOfMonth > 0 ? currentSpending / dayOfMonth : 0;
        const projectedTotal = dailyAverage * daysInMonth;

        return {
            success: true,
            data: {
                id: budget.id,
                categoryId: budget.category_id,
                categoryName: (budget.category as { name: string; color: string }).name,
                categoryColor: (budget.category as { name: string; color: string }).color,
                monthlyLimit,
                month,
                currentSpending,
                remainingAmount,
                percentageUsed,
                status,
                dailyAverage,
                projectedTotal,
                recentTransactions: (transactions || []).map((t) => ({
                    id: t.id,
                    date: t.date,
                    description: t.description,
                    amount: parseFloat(t.amount.toString()),
                })),
                createdAt: budget.created_at,
                updatedAt: budget.updated_at,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch budget',
        };
    }
}

/**
 * Create new budget
 */
export async function createBudget(
    input: z.infer<typeof createBudgetSchema>
): Promise<
    ActionResult<{
        id: string;
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        monthlyLimit: number;
        currentSpending: number;
        createdAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = createBudgetSchema.parse(input);

        const supabase = await createClient();

        // Verify category exists and user has access
        const { data: category } = await supabase
            .from('categories')
            .select('id, name, color, user_id, type')
            .eq('id', validated.categoryId)
            .single();

        if (
            !category ||
            (category.type === 'custom' && category.user_id !== userId)
        ) {
            return { success: false, error: 'Category not found' };
        }

        // Use provided month or default to current month
        const month = validated.month || getCurrentMonth();

        // Check for existing budget for this category and month
        const { data: existing } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', userId)
            .eq('category_id', validated.categoryId)
            .eq('month', month)
            .single();

        if (existing) {
            return {
                success: false,
                error: 'Budget already exists for this category this month',
            };
        }

        const { data, error } = await supabase
            .from('budgets')
            .insert({
                user_id: userId,
                category_id: validated.categoryId,
                month: month,
                amount: validated.monthlyLimit, // Set amount for backward compatibility
                monthly_limit: validated.monthlyLimit,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/budgets');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                id: data.id,
                categoryId: data.category_id,
                categoryName: category.name,
                categoryColor: category.color,
                monthlyLimit: parseFloat(data.monthly_limit.toString()),
                currentSpending: 0,
                createdAt: data.created_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to create budget',
        };
    }
}

/**
 * Update budget limit
 */
export async function updateBudget(
    input: z.infer<typeof updateBudgetSchema>
): Promise<
    ActionResult<{
        id: string;
        categoryId: string;
        categoryName: string;
        monthlyLimit: number;
        currentSpending: number;
        remainingAmount: number;
        percentageUsed: number;
        status: 'on_track' | 'warning' | 'exceeded';
        updatedAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = updateBudgetSchema.parse(input);

        const supabase = await createClient();

        // Verify budget exists
        const { data: existing } = await supabase
            .from('budgets')
            .select('category_id')
            .eq('id', validated.id)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Budget not found' };
        }

        const { data, error } = await supabase
            .from('budgets')
            .update({
                monthly_limit: validated.monthlyLimit,
                updated_at: new Date().toISOString(),
            })
            .eq('id', validated.id)
            .eq('user_id', userId)
            .select(
                `
        *,
        category:categories(id, name, color)
      `
            )
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        // Calculate current spending for current month
        const month = getCurrentMonth();
        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
            .toISOString()
            .split('T')[0];

        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('category_id', data.category_id)
            .eq('type', 'debit')
            .gte('date', startDate)
            .lte('date', endDate);

        const currentSpending = (transactions || []).reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
        );
        const monthlyLimit = parseFloat(data.monthly_limit.toString());
        const remainingAmount = monthlyLimit - currentSpending;
        const percentageUsed =
            monthlyLimit > 0 ? (currentSpending / monthlyLimit) * 100 : 0;
        const status = getBudgetStatus(percentageUsed);

        revalidatePath('/dashboard/budgets');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                id: data.id,
                categoryId: data.category_id,
                categoryName: (data.category as { name: string; color: string }).name,
                monthlyLimit,
                currentSpending,
                remainingAmount,
                percentageUsed,
                status,
                updatedAt: data.updated_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to update budget',
        };
    }
}

/**
 * Delete budget
 */
export async function deleteBudget(id: string): Promise<ActionResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/budgets');
        revalidatePath('/dashboard');

        return { success: true, data: undefined };
    } catch {
        return {
            success: false,
            error: 'Failed to delete budget',
        };
    }
}

/**
 * Get budget history over multiple months
 */
export async function getBudgetHistory(
    input: z.infer<typeof getBudgetHistorySchema>
): Promise<
    ActionResult<{
        categoryId: string;
        categoryName: string;
        months: Array<{
            month: string;
            budgetLimit: number;
            actualSpending: number;
            difference: number;
            percentageUsed: number;
            status: 'on_track' | 'warning' | 'exceeded';
        }>;
        average: {
            monthlyLimit: number;
            monthlySpending: number;
            monthlyDifference: number;
            averagePercentageUsed: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = getBudgetHistorySchema.parse(input);

        const supabase = await createClient();

        // Get category
        const { data: category } = await supabase
            .from('categories')
            .select('id, name')
            .eq('id', validated.categoryId)
            .single();

        if (!category) {
            return { success: false, error: 'Category not found' };
        }

        // Get budget for this category
        const { data: budget } = await supabase
            .from('budgets')
            .select('monthly_limit')
            .eq('user_id', userId)
            .eq('category_id', validated.categoryId)
            .single();

        const budgetLimit = budget
            ? parseFloat(budget.monthly_limit.toString())
            : 0;

        // Get transactions for date range
        const startDate = `${validated.startMonth}-01`;
        const [endYear, endMonth] = validated.endMonth.split('-');
        const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0)
            .toISOString()
            .split('T')[0];

        const { data: transactions } = await supabase
            .from('transactions')
            .select('date, amount')
            .eq('user_id', userId)
            .eq('category_id', validated.categoryId)
            .eq('type', 'debit')
            .gte('date', startDate)
            .lte('date', endDate);

        // Group by month
        const spendingByMonth = new Map<string, number>();
        (transactions || []).forEach((t) => {
            const month = t.date.substring(0, 7);
            const current = spendingByMonth.get(month) || 0;
            spendingByMonth.set(month, current + parseFloat(t.amount.toString()));
        });

        // Build monthly data
        const months: Array<{
            month: string;
            budgetLimit: number;
            actualSpending: number;
            difference: number;
            percentageUsed: number;
            status: 'on_track' | 'warning' | 'exceeded';
        }> = [];

        const start = new Date(`${validated.startMonth}-01`);
        const end = new Date(`${validated.endMonth}-01`);
        const current = new Date(start);

        while (current <= end) {
            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            const actualSpending = spendingByMonth.get(monthKey) || 0;
            const difference = budgetLimit - actualSpending;
            const percentageUsed =
                budgetLimit > 0 ? (actualSpending / budgetLimit) * 100 : 0;

            months.push({
                month: monthKey,
                budgetLimit,
                actualSpending,
                difference,
                percentageUsed,
                status: getBudgetStatus(percentageUsed),
            });

            current.setMonth(current.getMonth() + 1);
        }

        // Calculate averages
        const average = {
            monthlyLimit: budgetLimit,
            monthlySpending:
                months.reduce((sum, m) => sum + m.actualSpending, 0) / months.length,
            monthlyDifference:
                months.reduce((sum, m) => sum + m.difference, 0) / months.length,
            averagePercentageUsed:
                months.reduce((sum, m) => sum + m.percentageUsed, 0) / months.length,
        };

        return {
            success: true,
            data: {
                categoryId: validated.categoryId,
                categoryName: category.name,
                months,
                average,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to fetch budget history',
        };
    }
}

/**
 * Get budget alerts for current month
 */
export async function getBudgetAlerts(input?: { month?: string }): Promise<
    ActionResult<{
        month: string;
        alerts: Array<{
            budgetId: string;
            categoryName: string;
            categoryColor: string;
            monthlyLimit: number;
            currentSpending: number;
            percentageUsed: number;
            status: 'warning' | 'exceeded';
            severity: 'medium' | 'high';
        }>;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const month = input?.month || getCurrentMonth();

        // Reuse getBudgets logic
        const result = await getBudgets({ month });

        if (!result.success) {
            return { success: false, error: 'Failed to fetch budgets' };
        }

        const alerts = result.data.budgets
            .filter((b) => b.percentageUsed >= 80)
            .map((b) => ({
                budgetId: b.id,
                categoryName: b.categoryName,
                categoryColor: b.categoryColor,
                monthlyLimit: b.monthlyLimit,
                currentSpending: b.currentSpending,
                percentageUsed: b.percentageUsed,
                status: b.status as 'warning' | 'exceeded',
                severity: (b.status === 'exceeded' ? 'high' : 'medium') as
                    | 'medium'
                    | 'high',
            }))
            .sort((a, b) => b.percentageUsed - a.percentageUsed);

        return {
            success: true,
            data: {
                month,
                alerts,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch budget alerts',
        };
    }
}

/**
 * Calculate budget recommendations based on spending history
 */
export async function calculateBudgetRecommendations(
    input?: z.infer<typeof calculateBudgetRecommendationsSchema>
): Promise<
    ActionResult<{
        recommendations: Array<{
            categoryId: string;
            categoryName: string;
            currentBudget?: number;
            averageSpending: number;
            suggestedBudget: number;
            basedOnMonths: number;
            confidence: 'high' | 'medium' | 'low';
        }>;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = input
            ? calculateBudgetRecommendationsSchema.parse(input)
            : calculateBudgetRecommendationsSchema.parse({});
        const lookbackMonths = validated.lookbackMonths;

        const supabase = await createClient();

        // Calculate date range
        const now = new Date();
        const startMonth = new Date(
            now.getFullYear(),
            now.getMonth() - lookbackMonths,
            1
        );
        const startDate = startMonth.toISOString().split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0];

        // Get all transactions in range
        const { data: transactions } = await supabase
            .from('transactions')
            .select('date, category_id, amount')
            .eq('user_id', userId)
            .eq('type', 'debit')
            .gte('date', startDate)
            .lte('date', endDate);

        // Get categories
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .or(`user_id.eq.${userId},user_id.is.null`);

        // Get existing budgets
        const { data: budgets } = await supabase
            .from('budgets')
            .select('category_id, monthly_limit')
            .eq('user_id', userId);

        const budgetMap = new Map(
            (budgets || []).map((b) => [
                b.category_id,
                parseFloat(b.monthly_limit.toString()),
            ])
        );

        // Calculate spending by category and month
        const spendingData = new Map<
            string,
            { months: Map<string, number>; total: number }
        >();

        (transactions || []).forEach((t) => {
            if (!t.category_id) return;

            const month = t.date.substring(0, 7);
            if (!spendingData.has(t.category_id)) {
                spendingData.set(t.category_id, { months: new Map(), total: 0 });
            }

            const data = spendingData.get(t.category_id)!;
            const monthSpending = data.months.get(month) || 0;
            const amount = parseFloat(t.amount.toString());
            data.months.set(month, monthSpending + amount);
            data.total += amount;
        });

        // Build recommendations
        const recommendations = Array.from(spendingData.entries())
            .map(([categoryId, data]) => {
                const category = (categories || []).find((c) => c.id === categoryId);
                if (!category) return null;

                const monthsWithData = data.months.size;
                const averageSpending = data.total / Math.max(monthsWithData, 1);
                const suggestedBudget = Math.ceil(averageSpending * 1.1 * 100) / 100;

                // Calculate variance for confidence
                const monthlyAmounts = Array.from(data.months.values());
                const variance =
                    monthlyAmounts.reduce(
                        (sum, amt) => sum + Math.pow(amt - averageSpending, 2),
                        0
                    ) / monthsWithData;
                const stdDev = Math.sqrt(variance);
                const coefficientOfVariation =
                    averageSpending > 0 ? stdDev / averageSpending : 0;

                let confidence: 'high' | 'medium' | 'low';
                if (monthsWithData < 2) {
                    confidence = 'low';
                } else if (coefficientOfVariation < 0.15) {
                    confidence = 'high';
                } else if (coefficientOfVariation < 0.3) {
                    confidence = 'medium';
                } else {
                    confidence = 'low';
                }

                return {
                    categoryId,
                    categoryName: category.name,
                    currentBudget: budgetMap.get(categoryId),
                    averageSpending,
                    suggestedBudget,
                    basedOnMonths: monthsWithData,
                    confidence,
                };
            })
            .filter((r) => r !== null);

        return {
            success: true,
            data: {
                recommendations,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to calculate recommendations',
        };
    }
}
