'use client';

import { useRouter } from 'next/navigation';
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
import { login } from '@/lib/actions/auth';
import { useFormToast } from '@/hooks/use-form-toast';
import { LoginFormSchema } from '@/lib/schemas/auth';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';
import { Wallet, Instagram, Twitter, Facebook } from 'lucide-react';

type LoginFormValues = z.infer<typeof LoginFormSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { showSuccess, showError } = useFormToast();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(LoginFormSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            emailOrUsername: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        const result = await login({
            emailOrUsername: data.emailOrUsername,
            password: data.password,
        });

        if (result.success) {
            showSuccess('Welcome back!');
            router.push('/dashboard');
            router.refresh();
        } else {
            showError(getSupabaseErrorMessage(result.error) || 'Failed to log in');
        }
    };

    const formErrors = Object.entries(form.formState.errors).map(([field, error]) => ({
        field,
        label: field === 'emailOrUsername' ? 'Email or Username' : 'Password',
        message: error?.message || 'Invalid value',
    }));

    const handleErrorClick = (fieldName: string) => {
        const element = document.getElementById(fieldName);
        element?.focus();
    };

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Left Column - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 flex-col justify-between">
                <div className="flex items-center gap-2 text-2xl font-bold">
                    <Wallet className="h-8 w-8 text-primary" aria-hidden="true" />
                    <span>Cashanova</span>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Take control of your finances
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md">
                        Track your expenses, set budgets, achieve your savings goals, and build a better financial future with Cashanova - your personal finance companion.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 pt-4">
                        <span className="text-sm text-muted-foreground">Follow us:</span>
                        <div className="flex gap-2">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-10 px-4 rounded-full bg-background border border-border hover:bg-accent transition-colors"
                                aria-label="Follow us on Instagram"
                            >
                                <Instagram className="h-4 w-4" aria-hidden="true" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-10 px-4 rounded-full bg-background border border-border hover:bg-accent transition-colors"
                                aria-label="Follow us on Twitter"
                            >
                                <Twitter className="h-4 w-4" aria-hidden="true" />
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-10 px-4 rounded-full bg-background border border-border hover:bg-accent transition-colors"
                                aria-label="Follow us on Facebook"
                            >
                                <Facebook className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    © 2025 Cashanova. All rights reserved.
                </p>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Welcome back</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
                                <FormErrorSummary
                                    errors={formErrors}
                                    onErrorClick={handleErrorClick}
                                />

                                <FormField
                                    control={form.control}
                                    name="emailOrUsername"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email or Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="john@example.com or johndoe"
                                                    disabled={form.formState.isSubmitting}
                                                    aria-invalid={!!form.formState.errors.emailOrUsername}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Password</FormLabel>
                                                <Link
                                                    href="/reset-password"
                                                    className="text-sm text-primary underline-offset-4 hover:underline"
                                                    tabIndex={-1}
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    disabled={form.formState.isSubmitting}
                                                    aria-invalid={!!form.formState.errors.password}
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
                                    loading={form.formState.isSubmitting}
                                    loadingText="Logging in..."
                                >
                                    Log in
                                </LoadingButton>

                                <div className="text-sm text-center text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href="/signup"
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
