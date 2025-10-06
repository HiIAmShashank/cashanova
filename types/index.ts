/**
 * Helper Types
 * 
 * Convenience types for working with database entities throughout the application.
 * These build on top of the generated database types.
 */

import type { Database } from './database.types';

// Table row types
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type StatementImport =
    Database['public']['Tables']['statement_imports']['Row'];

// Insert types (for creating new records)
export type CategoryInsert =
    Database['public']['Tables']['categories']['Insert'];
export type TransactionInsert =
    Database['public']['Tables']['transactions']['Insert'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type StatementImportInsert =
    Database['public']['Tables']['statement_imports']['Insert'];

// Update types (for updating existing records)
export type CategoryUpdate =
    Database['public']['Tables']['categories']['Update'];
export type TransactionUpdate =
    Database['public']['Tables']['transactions']['Update'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];
export type StatementImportUpdate =
    Database['public']['Tables']['statement_imports']['Update'];

// Extended types with computed fields
export interface GoalWithProgress extends Goal {
    progressPercentage: number;
    remainingAmount: number;
}

export interface BudgetWithUsage extends Budget {
    spentAmount: number;
    remainingAmount: number;
    usagePercentage: number;
}

export interface TransactionWithCategory extends Transaction {
    category: Category | null;
}

// Dashboard summary types
export interface MonthlyFinancialSummary {
    month: string;
    totalInflows: number;
    totalOutflows: number;
    netBalance: number;
    budgetAmount: number | null;
    budgetUsed: number;
    budgetRemaining: number | null;
}

export interface SpendingByCategory {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
}

export interface DashboardData {
    summary: MonthlyFinancialSummary;
    spendingByCategory: SpendingByCategory[];
    recentTransactions: TransactionWithCategory[];
    goals: GoalWithProgress[];
}

// PDF Import types
export interface ParsedTransaction {
    date: string;
    particulars: string;
    debit: number | null;
    credit: number | null;
    balance: number;
}

export interface ParsedStatementData {
    transactions: ParsedTransaction[];
    metadata: {
        accountNumber?: string;
        statementPeriod?: string;
        openingBalance?: number;
        closingBalance?: number;
    };
}

// Server Action result types
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

export type ActionResultWithData<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
