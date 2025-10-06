'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import {
    signupSchema,
    loginSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
} from '@/lib/schemas/auth';

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new user account
 */
export async function signup(
    input: z.infer<typeof signupSchema>
): Promise<
    ActionResult<{
        user: { id: string; email: string; username: string };
    }>
> {
    try {
        // Validate input
        const validatedData = signupSchema.parse(input);

        const supabase = await createClient();

        // Create user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password,
            options: {
                data: {
                    username: validatedData.username,
                },
            },
        });

        if (error) {
            // Handle specific Supabase errors
            if (error.message.includes('already registered')) {
                return { success: false, error: 'Email already exists' };
            }
            if (error.message.includes('Password')) {
                return { success: false, error: 'Password too weak' };
            }
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'Failed to create user' };
        }

        return {
            success: true,
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                    username: validatedData.username,
                },
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'An unexpected error occurred during signup',
        };
    }
}

/**
 * Authenticate user with email/username and password
 */
export async function login(
    input: z.infer<typeof loginSchema>
): Promise<ActionResult<{ user: { id: string; email: string } }>> {
    try {
        // Validate input
        const validatedData = loginSchema.parse(input);

        const supabase = await createClient();

        // Supabase Auth only supports email login, so treat emailOrUsername as email
        const { data, error } = await supabase.auth.signInWithPassword({
            email: validatedData.emailOrUsername,
            password: validatedData.password,
        });

        if (error) {
            // Generic error to prevent user enumeration
            return { success: false, error: 'Invalid credentials' };
        }

        if (!data.user) {
            return { success: false, error: 'Invalid credentials' };
        }

        return {
            success: true,
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                },
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'An unexpected error occurred during login',
        };
    }
}

/**
 * Sign out current user
 */
export async function logout(): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: undefined };
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred during logout',
        };
    }
}

/**
 * Send password reset email to user
 */
export async function requestPasswordReset(
    input: z.infer<typeof requestPasswordResetSchema>
): Promise<ActionResult<{ message: string }>> {
    try {
        // Validate input
        const validatedData = requestPasswordResetSchema.parse(input);

        const supabase = await createClient();

        // Request password reset
        const { error } = await supabase.auth.resetPasswordForEmail(
            validatedData.email,
            {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
            }
        );

        // Always return success to prevent user enumeration
        if (error) {
            console.error('Password reset error:', error);
        }

        return {
            success: true,
            data: {
                message:
                    'If an account exists with this email, a password reset link has been sent.',
            },
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
        };
    }
}

/**
 * Update password with valid reset token
 */
export async function resetPassword(
    input: z.infer<typeof resetPasswordSchema>
): Promise<ActionResult> {
    try {
        // Validate input
        const validatedData = resetPasswordSchema.parse(input);

        const supabase = await createClient();

        // Update password
        const { error } = await supabase.auth.updateUser({
            password: validatedData.newPassword,
        });

        if (error) {
            if (error.message.includes('token')) {
                return { success: false, error: 'Invalid or expired token' };
            }
            return { success: false, error: error.message };
        }

        return { success: true, data: undefined };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return {
            success: false,
            error: 'An unexpected error occurred during password reset',
        };
    }
}

/**
 * Deactivate user account (prevent login, preserve data)
 */
export async function deactivateAccount(): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Update user metadata to mark as deactivated
        const { error } = await supabase.auth.updateUser({
            data: {
                is_active: false,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Sign out user
        await supabase.auth.signOut();

        return { success: true, data: undefined };
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred during account deactivation',
        };
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<
    ActionResult<{ id: string; email: string; username: string | null }>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        return {
            success: true,
            data: {
                id: user.id,
                email: user.email!,
                username: user.user_metadata?.username || null,
            },
        };
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred',
        };
    }
}
