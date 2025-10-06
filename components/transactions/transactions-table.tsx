'use client';

import { useState, useMemo, memo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    ArrowUpDown,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { TransactionFormModal } from '@/components/transactions/transaction-form-modal';
import { deleteTransaction } from '@/lib/actions/transactions';
import { toast } from 'sonner';
import type { TransactionWithCategory } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Category = {
    id: string;
    name: string;
    color: string;
};

type TransactionsTableProps = {
    initialTransactions: TransactionWithCategory[];
    categories: Category[];
    onRefresh: () => void;
};

// Memoize formatters to avoid recreating on every render
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function formatCurrency(amount: number): string {
    return currencyFormatter.format(amount);
}

function formatDate(date: string): string {
    return dateFormatter.format(new Date(date));
}

export function TransactionsTable({
    initialTransactions,
    categories,
    onRefresh,
}: TransactionsTableProps) {
    const [transactions] = useState(initialTransactions);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<TransactionWithCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const columns: ColumnDef<TransactionWithCategory>[] = useMemo(
        () => [
            {
                accessorKey: 'date',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === 'asc')
                            }
                            aria-label={`Sort by date ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                    );
                },
                cell: ({ row }) => formatDate(row.getValue('date')),
            },
            {
                accessorKey: 'description',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === 'asc')
                            }
                            aria-label={`Sort by description ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            Description
                            <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                    );
                },
            },
            {
                accessorKey: 'amount',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === 'asc')
                            }
                            aria-label={`Sort by amount ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            Amount
                            <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    const amount = row.getValue('amount') as number;
                    const type = row.original.type;
                    return (
                        <span
                            className={`font-medium ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                        >
                            {type === 'credit' ? '+' : '-'}
                            {formatCurrency(amount)}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'type',
                header: 'Type',
                cell: ({ row }) => {
                    const type = row.getValue('type') as string;
                    return (
                        <Badge variant={type === 'credit' ? 'default' : 'secondary'}>
                            {type === 'credit' ? 'Income' : 'Expense'}
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => {
                    return value === 'all' || row.getValue(id) === value;
                },
            },
            {
                accessorKey: 'category',
                header: 'Category',
                cell: ({ row }) => {
                    const category = row.original.category;
                    if (!category) {
                        return <span className="text-muted-foreground">Uncategorized</span>;
                    }
                    return (
                        <Badge
                            variant="outline"
                            style={{
                                borderColor: category.color,
                                color: category.color,
                            }}
                        >
                            {category.name}
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => {
                    if (value === 'all') return true;
                    if (value === 'none') return !row.original.category;
                    return row.original.category?.id === value;
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedTransaction(row.original);
                                    setFormOpen(true);
                                }}
                                aria-label={`Edit transaction: ${row.original.description}`}
                            >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedTransaction(row.original);
                                    setDeleteDialogOpen(true);
                                }}
                                aria-label={`Delete transaction: ${row.original.description}`}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: transactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const handleDelete = async () => {
        if (!selectedTransaction) return;

        setIsDeleting(true);
        try {
            const result = await deleteTransaction(selectedTransaction.id);

            if (result.success) {
                toast.success('Transaction deleted successfully');
                setDeleteDialogOpen(false);
                setSelectedTransaction(null);
                onRefresh();
            } else {
                toast.error(result.error || 'Failed to delete transaction');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Filters and Add Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                        <Input
                            placeholder="Search descriptions..."
                            value={
                                (table
                                    .getColumn('description')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                table
                                    .getColumn('description')
                                    ?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />

                        <Select
                            value={
                                (table.getColumn('type')?.getFilterValue() as string) ??
                                'all'
                            }
                            onValueChange={(value) =>
                                table.getColumn('type')?.setFilterValue(value)
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="credit">Income</SelectItem>
                                <SelectItem value="debit">Expense</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={
                                (table.getColumn('category')?.getFilterValue() as string) ??
                                'all'
                            }
                            onValueChange={(value) =>
                                table.getColumn('category')?.setFilterValue(value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="none">Uncategorized</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={() => {
                            setSelectedTransaction(null);
                            setFormOpen(true);
                        }}
                        aria-label="Add new transaction"
                    >
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add Transaction
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2" role="navigation" aria-label="Transactions pagination">
                    <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                        {table.getFilteredRowModel().rows.length} transaction(s) total
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            aria-label="Go to previous page"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            Previous
                        </Button>
                        <div className="text-sm" aria-live="polite" aria-atomic="true">
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            aria-label="Go to next page"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transaction Form Modal */}
            <TransactionFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                transaction={selectedTransaction}
                categories={categories}
                onSuccess={onRefresh}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this transaction? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(TransactionsTable);
