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
import { signup } from '@/lib/actions/auth';
import { toast } from 'sonner';
import { Wallet, Instagram, Twitter, Facebook } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await signup({
            username: formData.username,
            email: formData.email,
            password: formData.password,
        });

        setLoading(false);

        if (result.success) {
            toast.success('Account created! Please check your email to verify.');
            router.push('/login');
        } else {
            toast.error(result.error || 'Failed to create account');
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
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                    minLength={8}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    required
                                    minLength={8}
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign up'}
                            </Button>
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
                </Card>
            </div>
        </div>
    );
}
