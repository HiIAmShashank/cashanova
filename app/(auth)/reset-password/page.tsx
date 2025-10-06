'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/forms/loading-button';
import { FormErrorSummary } from '@/components/forms/form-error-summary';
import { requestPasswordReset, resetPassword } from '@/lib/actions/auth';
import { useFormToast } from '@/hooks/use-form-toast';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';

const RequestResetSchema = z.object({
    email: z.string().trim().email('Please enter a valid email address'),
});

const ResetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type RequestResetValues = z.infer<typeof RequestResetSchema>;
type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;


function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { showSuccess, showError } = useFormToast();

    const requestForm = useForm<RequestResetValues>({
        resolver: zodResolver(RequestResetSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: { email: '' },
    });

    const resetForm = useForm<ResetPasswordValues>({
        resolver: zodResolver(ResetPasswordSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const onRequestSubmit = async (data: RequestResetValues) => {
        const result = await requestPasswordReset({ email: data.email });

        if (result.success) {
            showSuccess('If an account exists with that email, you will receive a password reset link.');
        } else {
            showError(getSupabaseErrorMessage(result.error) || 'Failed to send reset email');
        }
    };

    const onResetSubmit = async (data: ResetPasswordValues) => {
        if (!token) {
            showError('Invalid reset token');
            return;
        }

        const result = await resetPassword({ token, newPassword: data.newPassword });

        if (result.success) {
            showSuccess('Password reset successful! You can now log in.');
            router.push('/login');
        } else {
            showError(getSupabaseErrorMessage(result.error) || 'Failed to reset password');
        }
    };

    const requestErrors = Object.entries(requestForm.formState.errors).map(([field, error]) => ({
        field,
        label: 'Email',
        message: error?.message || 'Invalid value',
    }));

    const resetErrors = Object.entries(resetForm.formState.errors).map(([field, error]) => ({
        field,
        label: field === 'newPassword' ? 'New Password' : 'Confirm Password',
        message: error?.message || 'Invalid value',
    }));

    const handleErrorClick = (fieldName: string) => {
        const element = document.getElementById(fieldName);
        element?.focus();
    };

    // If token exists, show reset form; otherwise show request form
    if (token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Reset your password</CardTitle>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>

                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                            <CardContent className="space-y-4">
                                <FormErrorSummary
                                    errors={resetErrors}
                                    onErrorClick={handleErrorClick}
                                />

                                <FormField
                                    control={resetForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    disabled={resetForm.formState.isSubmitting}
                                                    aria-invalid={!!resetForm.formState.errors.newPassword}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={resetForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    disabled={resetForm.formState.isSubmitting}
                                                    aria-invalid={!!resetForm.formState.errors.confirmPassword}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>

                            <CardFooter className="flex flex-col space-y-4">
                                <LoadingButton
                                    type="submit"
                                    className="w-full"
                                    loading={resetForm.formState.isSubmitting}
                                    loadingText="Resetting password..."
                                >
                                    Reset password
                                </LoadingButton>

                                <div className="text-sm text-center text-muted-foreground">
                                    Remember your password?{' '}
                                    <Link
                                        href="/login"
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        Log in
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot your password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a reset link
                    </CardDescription>
                </CardHeader>

                <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(onRequestSubmit)}>
                        <CardContent className="space-y-4">
                            <FormErrorSummary
                                errors={requestErrors}
                                onErrorClick={handleErrorClick}
                            />

                            <FormField
                                control={requestForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                placeholder="john@example.com"
                                                disabled={requestForm.formState.isSubmitting}
                                                aria-invalid={!!requestForm.formState.errors.email}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <LoadingButton
                                type="submit"
                                className="w-full"
                                loading={requestForm.formState.isSubmitting}
                                loadingText="Sending..."
                            >
                                Send reset link
                            </LoadingButton>

                            <div className="text-sm text-center text-muted-foreground">
                                Remember your password?{' '}
                                <Link
                                    href="/login"
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Log in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
