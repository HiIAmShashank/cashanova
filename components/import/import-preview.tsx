'use client';

import { useState } from 'react';
import { importTransactions } from '@/lib/actions/import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ParsedTransaction {
    tempId: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    categoryId?: string | null;
    originalParticulars: string;
    isSelected: boolean;
}

interface ImportPreviewProps {
    parsedData: {
        transactions: ParsedTransaction[];
        summary: {
            totalTransactions: number;
            totalCredits: number;
            totalDebits: number;
            dateRange: { start: string; end: string };
        };
    };
    categories?: Array<{ id: string; name: string; icon?: string }>;
    onBack: () => void;
    onComplete: () => void;
}

export function ImportPreview({ parsedData, categories = [], onBack, onComplete }: ImportPreviewProps) {
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>(parsedData.transactions);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<ParsedTransaction>>({});
    const [importing, setImporting] = useState(false);
    const { toast } = useToast();

    const toggleSelection = (tempId: string) => {
        setParsedTransactions((prev) =>
            prev.map((t) => (t.tempId === tempId ? { ...t, isSelected: !t.isSelected } : t))
        );
    };

    const toggleSelectAll = () => {
        const allSelected = parsedTransactions.every((t) => t.isSelected);
        setParsedTransactions((prev) =>
            prev.map((t) => ({ ...t, isSelected: !allSelected }))
        );
    };

    const startEdit = (transaction: ParsedTransaction) => {
        setEditingId(transaction.tempId);
        setEditValues({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            categoryId: transaction.categoryId,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    const saveEdit = (tempId: string) => {
        setParsedTransactions((prev) =>
            prev.map((t) =>
                t.tempId === tempId
                    ? {
                        ...t,
                        description: editValues.description || t.description,
                        amount: editValues.amount || t.amount,
                        type: editValues.type || t.type,
                        categoryId: editValues.categoryId !== undefined ? editValues.categoryId : t.categoryId,
                    }
                    : t
            )
        );
        setEditingId(null);
        setEditValues({});
    };

    const handleConfirmImport = async () => {
        const selectedTransactions = parsedTransactions
            .filter((t) => t.isSelected)
            .map((t) => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                categoryId: t.categoryId,
            }));

        if (selectedTransactions.length === 0) {
            toast({
                title: 'No transactions selected',
                description: 'Please select at least one transaction to import',
                variant: 'destructive',
            });
            return;
        }

        setImporting(true);

        try {
            const result = await importTransactions(selectedTransactions);

            if (result.success) {
                toast({
                    title: 'Import successful',
                    description: `${result.data.createdCount} transaction${result.data.createdCount !== 1 ? 's' : ''} imported`,
                });
                onComplete();
            } else {
                toast({
                    title: 'Import failed',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Import failed',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    };

    const selectedCount = parsedTransactions.filter((t) => t.isSelected).length;
    const selectedTotal = parsedTransactions
        .filter((t) => t.isSelected)
        .reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Import Summary</CardTitle>
                    <CardDescription>
                        {parsedData.summary.dateRange.start} to {parsedData.summary.dateRange.end}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-2xl font-bold">{parsedData.summary.totalTransactions}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Credits</p>
                        <p className="text-2xl font-bold text-green-600">
                            ${parsedData.summary.totalCredits.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Debits</p>
                        <p className="text-2xl font-bold text-red-600">
                            ${parsedData.summary.totalDebits.toFixed(2)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Parsed Transactions</CardTitle>
                            <CardDescription>
                                Review and edit transactions before importing
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                            {parsedTransactions.every((t) => t.isSelected) ? 'Deselect All' : 'Select All'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-2 text-left text-sm font-medium w-12"></th>
                                        <th className="p-2 text-left text-sm font-medium">Date</th>
                                        <th className="p-2 text-left text-sm font-medium">Description</th>
                                        <th className="p-2 text-left text-sm font-medium">Amount</th>
                                        <th className="p-2 text-left text-sm font-medium">Type</th>
                                        <th className="p-2 text-left text-sm font-medium">Category</th>
                                        <th className="p-2 text-left text-sm font-medium w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedTransactions.map((transaction) => (
                                        <tr key={transaction.tempId} className="border-b hover:bg-muted/50">
                                            <td className="p-2">
                                                <Checkbox
                                                    checked={transaction.isSelected}
                                                    onCheckedChange={() => toggleSelection(transaction.tempId)}
                                                />
                                            </td>
                                            <td className="p-2 text-sm">{transaction.date}</td>
                                            <td className="p-2 text-sm">
                                                {editingId === transaction.tempId ? (
                                                    <Input
                                                        value={editValues.description || ''}
                                                        onChange={(e) =>
                                                            setEditValues((prev) => ({
                                                                ...prev,
                                                                description: e.target.value,
                                                            }))
                                                        }
                                                        className="h-8"
                                                    />
                                                ) : (
                                                    transaction.description
                                                )}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {editingId === transaction.tempId ? (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValues.amount || ''}
                                                        onChange={(e) =>
                                                            setEditValues((prev) => ({
                                                                ...prev,
                                                                amount: parseFloat(e.target.value),
                                                            }))
                                                        }
                                                        className="h-8 w-24"
                                                    />
                                                ) : (
                                                    `$${transaction.amount.toFixed(2)}`
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {editingId === transaction.tempId ? (
                                                    <Select
                                                        value={editValues.type || transaction.type}
                                                        onValueChange={(value) =>
                                                            setEditValues((prev) => ({
                                                                ...prev,
                                                                type: value as 'credit' | 'debit',
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-24">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="credit">Credit</SelectItem>
                                                            <SelectItem value="debit">Debit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge
                                                        variant={
                                                            transaction.type === 'credit' ? 'default' : 'secondary'
                                                        }
                                                    >
                                                        {transaction.type === 'credit' ? (
                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                        )}
                                                        {transaction.type}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {editingId === transaction.tempId ? (
                                                    <Select
                                                        value={editValues.categoryId || transaction.categoryId || 'none'}
                                                        onValueChange={(value) =>
                                                            setEditValues((prev) => ({
                                                                ...prev,
                                                                categoryId: value === 'none' ? null : value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat.id} value={cat.id}>
                                                                    {cat.icon} {cat.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : transaction.categoryId ? (
                                                    <Badge variant="outline">
                                                        {categories.find((c) => c.id === transaction.categoryId)?.name ||
                                                            'Unknown'}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">None</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {editingId === transaction.tempId ? (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => saveEdit(transaction.tempId)}
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEdit(transaction)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {selectedCount} transactions selected · Net: ${Math.abs(selectedTotal).toFixed(2)}{' '}
                            {selectedTotal >= 0 ? 'credit' : 'debit'}
                        </div>
                        <Button onClick={handleConfirmImport} disabled={selectedCount === 0 || importing}>
                            {importing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
