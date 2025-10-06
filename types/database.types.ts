/**
 * Database Types
 * 
 * This file contains TypeScript type definitions for the Cashanova database schema.
 * These types should be kept in sync with the Supabase database schema.
 * 
 * To regenerate from Supabase (after schema changes):
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string;
                    user_id: string | null;
                    name: string;
                    type: 'system' | 'custom';
                    color: string;
                    icon: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    name: string;
                    type: 'system' | 'custom';
                    color?: string;
                    icon?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    name?: string;
                    type?: 'system' | 'custom';
                    color?: string;
                    icon?: string | null;
                    created_at?: string;
                };
            };
            transactions: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    description: string;
                    amount: number;
                    type: 'credit' | 'debit';
                    category_id: string | null;
                    original_particulars: string | null;
                    import_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date: string;
                    description: string;
                    amount: number;
                    type: 'credit' | 'debit';
                    category_id?: string | null;
                    original_particulars?: string | null;
                    import_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    date?: string;
                    description?: string;
                    amount?: number;
                    type?: 'credit' | 'debit';
                    category_id?: string | null;
                    original_particulars?: string | null;
                    import_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            goals: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    target_amount: number;
                    current_amount: number;
                    color: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    target_amount: number;
                    current_amount?: number;
                    color?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    target_amount?: number;
                    current_amount?: number;
                    color?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            budgets: {
                Row: {
                    id: string;
                    user_id: string;
                    month: string;
                    amount: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    month: string;
                    amount: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    month?: string;
                    amount?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            statement_imports: {
                Row: {
                    id: string;
                    user_id: string;
                    filename: string;
                    uploaded_at: string;
                    parsed_at: string | null;
                    status: 'pending' | 'parsing' | 'parsed' | 'confirmed' | 'failed';
                    error_message: string | null;
                    transaction_count: number;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    filename: string;
                    uploaded_at?: string;
                    parsed_at?: string | null;
                    status: 'pending' | 'parsing' | 'parsed' | 'confirmed' | 'failed';
                    error_message?: string | null;
                    transaction_count?: number;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    filename?: string;
                    uploaded_at?: string;
                    parsed_at?: string | null;
                    status?: 'pending' | 'parsing' | 'parsed' | 'confirmed' | 'failed';
                    error_message?: string | null;
                    transaction_count?: number;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
