'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';
import {
    createGoalSchema,
    updateGoalSchema,
    allocateFundsSchema,
    deallocateFundsSchema,
    getGoalsSchema,
} from '@/lib/schemas/goals';

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

function calculateProgress(
    currentAmount: number,
    targetAmount: number
): number {
    if (targetAmount === 0) return 100;
    return Math.min((currentAmount / targetAmount) * 100, 100);
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get all goals for current user
 */
export async function getGoals(input?: z.infer<typeof getGoalsSchema>): Promise<
    ActionResult<{
        goals: Array<{
            id: string;
            name: string;
            description?: string;
            targetAmount: number;
            currentAmount: number;
            targetDate?: string;
            color: string;
            icon?: string;
            status: 'active' | 'completed';
            progress: number;
            createdAt: string;
            updatedAt: string;
        }>;
        summary: {
            totalGoals: number;
            activeGoals: number;
            completedGoals: number;
            totalTargetAmount: number;
            totalSaved: number;
            overallProgress: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = input ? getGoalsSchema.parse(input) : getGoalsSchema.parse({});
        const { status, sortBy, sortOrder } = validated;

        const supabase = await createClient();

        let query = supabase.from('goals').select('*').eq('user_id', userId);

        // Filter by status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Apply sorting
        if (sortBy === 'progress') {
            // Progress is calculated, so fetch all and sort in JS
            const { data, error } = await query;
            if (error) {
                return { success: false, error: error.message };
            }

            const goalsWithProgress = data.map((goal) => ({
                ...goal,
                progress: calculateProgress(
                    parseFloat(goal.current_amount.toString()),
                    parseFloat(goal.target_amount.toString())
                ),
            }));

            goalsWithProgress.sort((a, b) => {
                const diff = sortOrder === 'asc' ? a.progress - b.progress : b.progress - a.progress;
                return diff;
            });

            // Calculate summary
            const summary = {
                totalGoals: goalsWithProgress.length,
                activeGoals: goalsWithProgress.filter((g) => g.status === 'active').length,
                completedGoals: goalsWithProgress.filter((g) => g.status === 'completed').length,
                totalTargetAmount: goalsWithProgress.reduce(
                    (sum, g) => sum + parseFloat(g.target_amount.toString()),
                    0
                ),
                totalSaved: goalsWithProgress.reduce(
                    (sum, g) => sum + parseFloat(g.current_amount.toString()),
                    0
                ),
                overallProgress: 0,
            };

            if (summary.totalTargetAmount > 0) {
                summary.overallProgress = (summary.totalSaved / summary.totalTargetAmount) * 100;
            }

            return {
                success: true,
                data: {
                    goals: goalsWithProgress.map((g) => ({
                        id: g.id,
                        name: g.name,
                        description: g.description || undefined,
                        targetAmount: parseFloat(g.target_amount.toString()),
                        currentAmount: parseFloat(g.current_amount.toString()),
                        targetDate: g.target_date || undefined,
                        color: g.color,
                        icon: g.icon || undefined,
                        status: g.status as 'active' | 'completed',
                        progress: g.progress,
                        createdAt: g.created_at,
                        updatedAt: g.updated_at,
                    })),
                    summary,
                },
            };
        } else {
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            const { data, error } = await query;
            if (error) {
                return { success: false, error: error.message };
            }

            const goalsWithProgress = data.map((goal) => ({
                id: goal.id,
                name: goal.name,
                description: goal.description || undefined,
                targetAmount: parseFloat(goal.target_amount.toString()),
                currentAmount: parseFloat(goal.current_amount.toString()),
                targetDate: goal.target_date || undefined,
                color: goal.color,
                icon: goal.icon || undefined,
                status: goal.status as 'active' | 'completed',
                progress: calculateProgress(
                    parseFloat(goal.current_amount.toString()),
                    parseFloat(goal.target_amount.toString())
                ),
                createdAt: goal.created_at,
                updatedAt: goal.updated_at,
            }));

            const summary = {
                totalGoals: goalsWithProgress.length,
                activeGoals: goalsWithProgress.filter((g) => g.status === 'active').length,
                completedGoals: goalsWithProgress.filter((g) => g.status === 'completed')
                    .length,
                totalTargetAmount: goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0),
                totalSaved: goalsWithProgress.reduce((sum, g) => sum + g.currentAmount, 0),
                overallProgress: 0,
            };

            if (summary.totalTargetAmount > 0) {
                summary.overallProgress = (summary.totalSaved / summary.totalTargetAmount) * 100;
            }

            return {
                success: true,
                data: {
                    goals: goalsWithProgress,
                    summary,
                },
            };
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to fetch goals',
        };
    }
}

/**
 * Get single goal by ID
 */
export async function getGoal(id: string): Promise<
    ActionResult<{
        id: string;
        name: string;
        description?: string;
        targetAmount: number;
        currentAmount: number;
        targetDate?: string;
        color: string;
        icon?: string;
        status: 'active' | 'completed';
        progress: number;
        createdAt: string;
        updatedAt: string;
        projectedCompletion?: {
            estimatedDate: string;
            monthsRemaining: number;
        };
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Goal not found' };
            }
            return { success: false, error: error.message };
        }

        const targetAmount = parseFloat(data.target_amount.toString());
        const currentAmount = parseFloat(data.current_amount.toString());
        const progress = calculateProgress(currentAmount, targetAmount);

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                description: data.description || undefined,
                targetAmount,
                currentAmount,
                targetDate: data.target_date || undefined,
                color: data.color,
                icon: data.icon || undefined,
                status: data.status as 'active' | 'completed',
                progress,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                // projectedCompletion would require allocation history - simplified for now
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to fetch goal',
        };
    }
}

/**
 * Create new goal
 */
export async function createGoal(
    input: z.infer<typeof createGoalSchema>
): Promise<
    ActionResult<{
        id: string;
        name: string;
        description?: string;
        targetAmount: number;
        currentAmount: number;
        targetDate?: string;
        color: string;
        icon?: string;
        status: 'active';
        progress: number;
        createdAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = createGoalSchema.parse(input);

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('goals')
            .insert({
                user_id: userId,
                name: validated.name,
                description: validated.description || null,
                target_amount: validated.targetAmount,
                current_amount: 0,
                target_date: validated.targetDate || null,
                color: validated.color,
                icon: validated.icon || null,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/goals');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                description: data.description || undefined,
                targetAmount: parseFloat(data.target_amount.toString()),
                currentAmount: parseFloat(data.current_amount.toString()),
                targetDate: data.target_date || undefined,
                color: data.color,
                icon: data.icon || undefined,
                status: 'active',
                progress: 0,
                createdAt: data.created_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to create goal',
        };
    }
}

/**
 * Update existing goal
 */
export async function updateGoal(
    input: z.infer<typeof updateGoalSchema>
): Promise<
    ActionResult<{
        id: string;
        progress: number;
        updatedAt: string;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = updateGoalSchema.parse(input);
        const { id, ...updates } = validated;

        const supabase = await createClient();

        // Verify goal exists and belongs to user
        const { data: existing } = await supabase
            .from('goals')
            .select('status, current_amount, target_amount')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Goal not found' };
        }

        if (existing.status === 'completed') {
            return { success: false, error: 'Cannot update completed goal' };
        }

        const { data, error } = await supabase
            .from('goals')
            .update({
                name: updates.name,
                description:
                    updates.description === null ? null : updates.description || undefined,
                target_amount: updates.targetAmount,
                target_date:
                    updates.targetDate === null ? null : updates.targetDate || undefined,
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

        const progress = calculateProgress(
            parseFloat(data.current_amount.toString()),
            parseFloat(data.target_amount.toString())
        );

        revalidatePath('/dashboard/goals');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: {
                id: data.id,
                progress,
                updatedAt: data.updated_at,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to update goal',
        };
    }
}

/**
 * Delete goal
 */
export async function deleteGoal(id: string): Promise<ActionResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        // Check if goal has allocated funds
        const { data: existing } = await supabase
            .from('goals')
            .select('current_amount')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Goal not found' };
        }

        if (parseFloat(existing.current_amount.toString()) > 0) {
            return {
                success: false,
                error: 'Cannot delete goal with allocated funds',
            };
        }

        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/goals');
        revalidatePath('/dashboard');

        return { success: true, data: undefined };
    } catch {
        return {
            success: false,
            error: 'Failed to delete goal',
        };
    }
}

/**
 * Allocate funds to a goal
 */
export async function allocateFunds(
    input: z.infer<typeof allocateFundsSchema>
): Promise<
    ActionResult<{
        goalId: string;
        previousAmount: number;
        newAmount: number;
        amountAdded: number;
        newProgress: number;
        status: 'active' | 'completed';
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = allocateFundsSchema.parse(input);

        const supabase = await createClient();

        const { data: existing } = await supabase
            .from('goals')
            .select('current_amount, target_amount, status')
            .eq('id', validated.goalId)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Goal not found' };
        }

        const previousAmount = parseFloat(existing.current_amount.toString());
        const targetAmount = parseFloat(existing.target_amount.toString());
        const newAmount = previousAmount + validated.amount;
        const newStatus: 'active' | 'completed' = newAmount >= targetAmount ? 'completed' : 'active';
        const newProgress = calculateProgress(newAmount, targetAmount);

        // Get goal name for transaction description
        const { data: goal } = await supabase
            .from('goals')
            .select('name')
            .eq('id', validated.goalId)
            .eq('user_id', userId)
            .single();

        // Update goal amount
        const { error: goalError } = await supabase
            .from('goals')
            .update({
                current_amount: newAmount,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', validated.goalId)
            .eq('user_id', userId);

        if (goalError) {
            return { success: false, error: goalError.message };
        }

        // Create a debit transaction for the allocation
        const description = validated.note
            ? `Goal: ${goal?.name || 'Savings'} - ${validated.note}`
            : `Allocated to goal: ${goal?.name || 'Savings'}`;

        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                date: new Date().toISOString().split('T')[0],
                description: description,
                amount: validated.amount,
                type: 'debit',
                category_id: null, // Goal allocations are uncategorized
            });

        if (transactionError) {
            // Transaction creation failed, but goal was updated
            // Log warning but don't fail the operation
            console.warn('Failed to create transaction for goal allocation:', transactionError);
        }

        revalidatePath('/dashboard/goals');
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/transactions');

        return {
            success: true,
            data: {
                goalId: validated.goalId,
                previousAmount,
                newAmount,
                amountAdded: validated.amount,
                newProgress,
                status: newStatus,
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to allocate funds',
        };
    }
}

/**
 * Deallocate funds from a goal
 */
export async function deallocateFunds(
    input: z.infer<typeof deallocateFundsSchema>
): Promise<
    ActionResult<{
        goalId: string;
        previousAmount: number;
        newAmount: number;
        amountRemoved: number;
        newProgress: number;
        status: 'active';
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const validated = deallocateFundsSchema.parse(input);

        const supabase = await createClient();

        const { data: existing } = await supabase
            .from('goals')
            .select('current_amount, target_amount')
            .eq('id', validated.goalId)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            return { success: false, error: 'Goal not found' };
        }

        const previousAmount = parseFloat(existing.current_amount.toString());
        if (validated.amount > previousAmount) {
            return { success: false, error: 'Insufficient funds' };
        }

        const targetAmount = parseFloat(existing.target_amount.toString());
        const newAmount = previousAmount - validated.amount;
        const newProgress = calculateProgress(newAmount, targetAmount);

        // Get goal name for transaction description
        const { data: goal } = await supabase
            .from('goals')
            .select('name')
            .eq('id', validated.goalId)
            .eq('user_id', userId)
            .single();

        // Update goal amount
        const { error: goalError } = await supabase
            .from('goals')
            .update({
                current_amount: newAmount,
                status: 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('id', validated.goalId)
            .eq('user_id', userId);

        if (goalError) {
            return { success: false, error: goalError.message };
        }

        // Create a credit transaction for the deallocation
        const description = validated.note
            ? `Goal: ${goal?.name || 'Savings'} - ${validated.note}`
            : `Removed from goal: ${goal?.name || 'Savings'}`;

        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                date: new Date().toISOString().split('T')[0],
                description: description,
                amount: validated.amount,
                type: 'credit',
                category_id: null, // Goal deallocations are uncategorized
            });

        if (transactionError) {
            // Transaction creation failed, but goal was updated
            // Log warning but don't fail the operation
            console.warn('Failed to create transaction for goal deallocation:', transactionError);
        }

        revalidatePath('/dashboard/goals');
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/transactions');

        return {
            success: true,
            data: {
                goalId: validated.goalId,
                previousAmount,
                newAmount,
                amountRemoved: validated.amount,
                newProgress,
                status: 'active',
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'Failed to deallocate funds',
        };
    }
}

/**
 * Get goal projection
 */
export async function getGoalProjection(input: {
    goalId: string;
    assumedMonthlyContribution?: number;
}): Promise<
    ActionResult<{
        goalId: string;
        currentAmount: number;
        targetAmount: number;
        remainingAmount: number;
        targetDate?: string;
        projectedCompletion?: {
            estimatedDate: string;
            monthsRemaining: number;
            assumedMonthlyRate: number;
        };
        isOnTrack: boolean;
    }>
> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const supabase = await createClient();

        const { data: goal } = await supabase
            .from('goals')
            .select('current_amount, target_amount, target_date')
            .eq('id', input.goalId)
            .eq('user_id', userId)
            .single();

        if (!goal) {
            return { success: false, error: 'Goal not found' };
        }

        const currentAmount = parseFloat(goal.current_amount.toString());
        const targetAmount = parseFloat(goal.target_amount.toString());
        const remainingAmount = targetAmount - currentAmount;

        // Simplified projection (no allocation history in current schema)
        const monthlyRate = input.assumedMonthlyContribution || 0;

        let projectedCompletion;
        if (monthlyRate > 0 && remainingAmount > 0) {
            const monthsRemaining = Math.ceil(remainingAmount / monthlyRate);
            const estimatedDate = new Date();
            estimatedDate.setMonth(estimatedDate.getMonth() + monthsRemaining);
            projectedCompletion = {
                estimatedDate: estimatedDate.toISOString().split('T')[0],
                monthsRemaining,
                assumedMonthlyRate: monthlyRate,
            };
        }

        const isOnTrack =
            !goal.target_date ||
            !projectedCompletion ||
            projectedCompletion.estimatedDate <= goal.target_date;

        return {
            success: true,
            data: {
                goalId: input.goalId,
                currentAmount,
                targetAmount,
                remainingAmount,
                targetDate: goal.target_date || undefined,
                projectedCompletion,
                isOnTrack,
            },
        };
    } catch {
        return {
            success: false,
            error: 'Failed to get goal projection',
        };
    }
}
