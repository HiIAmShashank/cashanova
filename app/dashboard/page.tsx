import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target } from 'lucide-react';
import { getMonthlyTotals } from '@/lib/actions/transactions';
import { getBudgets } from '@/lib/actions/budgets';
import { getGoals } from '@/lib/actions/goals';
import { getTransactions } from '@/lib/actions/transactions';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export default async function DashboardPage() {
    const currentMonth = getCurrentMonth();

    // Fetch all dashboard data in parallel
    const [monthlyTotalsResult, budgetsResult, goalsResult, recentTransactionsResult] =
        await Promise.all([
            getMonthlyTotals(currentMonth),
            getBudgets({ month: currentMonth }),
            getGoals({ status: 'active', sortBy: 'created_at', sortOrder: 'desc' }),
            getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        ]);

    // Extract data or use defaults
    const monthlyTotals = monthlyTotalsResult.success
        ? monthlyTotalsResult.data
        : { totalCredits: 0, totalDebits: 0, netAmount: 0, transactionCount: 0 };

    const budgetsData = budgetsResult.success ? budgetsResult.data : null;
    const budgetSummary = budgetsData?.summary || {
        totalBudgeted: 0,
        totalSpent: 0,
        categoriesExceeded: 0,
    };

    const goalsData = goalsResult.success ? goalsResult.data : null;
    const goalsSummary = goalsData?.summary || {
        totalTargetAmount: 0,
        totalSaved: 0,
        activeGoals: 0,
    };

    const recentTransactions =
        recentTransactionsResult.success
            ? recentTransactionsResult.data?.transactions || []
            : [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your financial health</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Account Balance Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(monthlyTotals.netAmount)}
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    Income
                                </span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(monthlyTotals.totalCredits)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    Expenses
                                </span>
                                <span className="font-medium text-red-600">
                                    {formatCurrency(monthlyTotals.totalDebits)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                        <Badge
                            variant={
                                budgetSummary.categoriesExceeded > 0 ? 'destructive' : 'default'
                            }
                        >
                            {budgetSummary.categoriesExceeded > 0
                                ? `${budgetSummary.categoriesExceeded} over`
                                : 'On track'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(budgetSummary.totalSpent)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            of {formatCurrency(budgetSummary.totalBudgeted)} budgeted
                        </p>
                        {budgetSummary.totalBudgeted > 0 && (
                            <div className="mt-4">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                            width: `${Math.min(
                                                (budgetSummary.totalSpent /
                                                    budgetSummary.totalBudgeted) *
                                                100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Goals Progress Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(goalsSummary.totalSaved)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            of {formatCurrency(goalsSummary.totalTargetAmount)} target
                        </p>
                        {goalsSummary.activeGoals > 0 && (
                            <div className="mt-4">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                            width: `${Math.min(
                                                (goalsSummary.totalSaved / goalsSummary.totalTargetAmount) *
                                                100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {goalsSummary.activeGoals} active{' '}
                                    {goalsSummary.activeGoals === 1 ? 'goal' : 'goals'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                            No transactions yet. Start by adding your first transaction!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {transaction.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(transaction.date)}
                                            </p>
                                            {transaction.category && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{
                                                        borderColor: transaction.category.color,
                                                        color: transaction.category.color,
                                                    }}
                                                >
                                                    {transaction.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`text-sm font-semibold ${transaction.type === 'credit'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        {transaction.type === 'credit' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
