import { z } from 'zod';

// ============================================================================
// Zod Validation Schemas for Authentication
// ============================================================================

export const signupSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores'
        ),
    email: z.string().email('Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Form schema with password confirmation for React Hook Form
export const SignupFormSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores'
        ),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username required'),
    password: z.string().min(1, 'Password required'),
});

// Form schema for React Hook Form
export const LoginFormSchema = z.object({
    emailOrUsername: z.string().trim().min(1, 'Please enter your email or username'),
    password: z.string().min(1, 'Please enter your password'),
});

export const requestPasswordResetSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
