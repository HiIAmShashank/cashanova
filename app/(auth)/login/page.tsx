'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { login } from '@/lib/actions/auth';
import { toast } from 'sonner';
import { Wallet, Instagram, Twitter, Facebook } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        emailOrUsername: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await login({
            emailOrUsername: formData.emailOrUsername,
            password: formData.password,
        });

        setLoading(false);

        if (result.success) {
            toast.success('Welcome back!');
            router.push('/dashboard');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to log in');
        }
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
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="emailOrUsername">Email or Username</Label>
                                <Input
                                    id="emailOrUsername"
                                    type="text"
                                    placeholder="john@example.com or johndoe"
                                    value={formData.emailOrUsername}
                                    onChange={(e) =>
                                        setFormData({ ...formData, emailOrUsername: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/reset-password"
                                        className="text-sm text-primary underline-offset-4 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Logging in...' : 'Log in'}
                            </Button>
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
                </Card>
            </div>
        </div>
    );
}
