'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CategoryFormModal } from './category-form-modal';
import { deleteCategory } from '@/lib/actions/categories';
import { toast } from 'sonner';
import { Plus, Tag, Pencil, Trash2, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type Category = {
    id: string;
    name: string;
    color: string;
    icon?: string;
    isSystem: boolean;
    createdAt: string;
    transactionCount?: number;
    totalAmount?: number;
};

type CategoriesListProps = {
    categories: Category[];
    onRefresh: () => void;
};

export function CategoriesList({ categories, onRefresh }: CategoriesListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [reassignCategoryId, setReassignCategoryId] = useState<string>('none');
    const [isDeleting, setIsDeleting] = useState(false);

    const systemCategories = categories.filter((c) => c.isSystem);
    const customCategories = categories.filter((c) => !c.isSystem);

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (category: Category) => {
        setDeletingCategory(category);
        setReassignCategoryId('none');
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;

        setIsDeleting(true);
        try {
            const result = await deleteCategory({
                id: deletingCategory.id,
                reassignTo: reassignCategoryId !== 'none' ? reassignCategoryId : undefined,
            });

            if (result.success) {
                toast.success('Category deleted successfully');
                onRefresh();
                setDeleteDialogOpen(false);
                setDeletingCategory(null);
            } else {
                toast.error(result.error || 'Failed to delete category');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        onRefresh();
        setEditingCategory(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const renderCategoryCard = (category: Category, showActions = true) => {
        const IconComponent = category.icon
            ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon]
            : null;

        return (
            <Card key={category.id}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                                className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                            >
                                {IconComponent ? (
                                    <IconComponent className="h-5 w-5 text-white" />
                                ) : (
                                    <Tag className="h-5 w-5 text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium truncate">{category.name}</h3>
                                    {category.isSystem && (
                                        <Badge variant="outline" className="text-xs">
                                            <Lock className="h-3 w-3 mr-1" />
                                            System
                                        </Badge>
                                    )}
                                </div>
                                {(category.transactionCount !== undefined || category.totalAmount !== undefined) && (
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        {category.transactionCount !== undefined && (
                                            <p>
                                                {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                        {category.totalAmount !== undefined && category.totalAmount > 0 && (
                                            <p className="font-medium text-foreground">
                                                {formatCurrency(category.totalAmount)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {showActions && !category.isSystem && (
                            <div className="flex gap-1 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(category)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteClick(category)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const reassignOptions = categories.filter(
        (c) => c.id !== deletingCategory?.id
    );
    const hasTransactions = (deletingCategory?.transactionCount ?? 0) > 0;

    return (
        <>
            {/* Summary Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Categories Summary
                            </CardTitle>
                            <CardDescription>Organize your transactions</CardDescription>
                        </div>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <div className="text-2xl font-bold">{categories.length}</div>
                            <p className="text-xs text-muted-foreground">Total Categories</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{systemCategories.length}</div>
                            <p className="text-xs text-muted-foreground">System Categories</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{customCategories.length}</div>
                            <p className="text-xs text-muted-foreground">Custom Categories</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Categories */}
            {systemCategories.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4">System Categories</h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {systemCategories.map((category) => renderCategoryCard(category, false))}
                    </div>
                </div>
            )}

            {/* Custom Categories */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Custom Categories</h2>
                {customCategories.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No custom categories yet</h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                                Create custom categories to better organize your transactions beyond
                                the system defaults.
                            </p>
                            <Button onClick={() => setIsFormOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Category
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {customCategories.map((category) => renderCategoryCard(category))}
                    </div>
                )}
            </div>

            {/* Category Form Modal */}
            <CategoryFormModal
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingCategory(null);
                }}
                category={editingCategory}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category?</DialogTitle>
                        <DialogDescription>
                            {hasTransactions ? (
                                <>
                                    This category has {deletingCategory?.transactionCount} transaction
                                    {deletingCategory?.transactionCount !== 1 ? 's' : ''}. You can
                                    either reassign them to another category or leave them uncategorized.
                                </>
                            ) : (
                                'This will permanently delete this category. This action cannot be undone.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {hasTransactions && (
                        <div className="space-y-2">
                            <Label htmlFor="reassign">Reassign transactions to:</Label>
                            <Select
                                value={reassignCategoryId}
                                onValueChange={setReassignCategoryId}
                            >
                                <SelectTrigger id="reassign">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Leave uncategorized</SelectItem>
                                    {reassignOptions.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeletingCategory(null);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            variant="destructive"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
