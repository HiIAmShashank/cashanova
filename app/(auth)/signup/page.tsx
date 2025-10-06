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
import { signup } from '@/lib/actions/auth';
import { useFormToast } from '@/hooks/use-form-toast';
import { SignupFormSchema } from '@/lib/schemas/auth';
import { getSupabaseErrorMessage } from '@/lib/utils/error-messages';
import { Wallet, Instagram, Twitter, Facebook } from 'lucide-react';

type SignupFormValues = z.infer<typeof SignupFormSchema>;

export default function SignupPage() {
    const router = useRouter();
    const { showSuccess, showError } = useFormToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(SignupFormSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: SignupFormValues) => {
        const result = await signup({
            username: data.username,
            email: data.email,
            password: data.password,
        });

        if (result.success) {
            showSuccess('Account created! Please check your email to verify.');
            router.push('/login');
        } else {
            showError(getSupabaseErrorMessage(result.error) || 'Failed to create account');
        }
    };

    const formErrors = Object.entries(form.formState.errors).map(([field, error]) => ({
        field,
        label: field === 'username' ? 'Username' :
            field === 'email' ? 'Email' :
                field === 'password' ? 'Password' : 'Confirm Password',
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
                        Start your financial journey today
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md">
                        Join thousands of users who have taken control of their finances. Track expenses, create budgets, set goals, and achieve financial freedom with Cashanova.
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

            {/* Right Column - Signup Form */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create an account</CardTitle>
                        <CardDescription>
                            Enter your details below to create your Cashanova account
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
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="johndoe"
                                                    disabled={form.formState.isSubmitting}
                                                    aria-invalid={!!form.formState.errors.username}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    disabled={form.formState.isSubmitting}
                                                    aria-invalid={!!form.formState.errors.email}
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
                                            <FormLabel>Password</FormLabel>
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

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    disabled={form.formState.isSubmitting}
                                                    aria-invalid={!!form.formState.errors.confirmPassword}
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
                                    loadingText="Creating account..."
                                >
                                    Sign up
                                </LoadingButton>

                                <div className="text-sm text-center text-muted-foreground">
                                    Already have an account?{' '}
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
        </div>
    );
}
