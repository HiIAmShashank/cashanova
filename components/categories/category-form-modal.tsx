'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCategory, updateCategory } from '@/lib/actions/categories';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';

type Category = {
    id: string;
    name: string;
    color: string;
    icon?: string;
    isSystem: boolean;
};

type CategoryFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
    onSuccess: () => void;
};

const formSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
    icon: z.string().optional(),
});

const DEFAULT_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#a855f7', // violet
];

const POPULAR_ICONS = [
    'ShoppingCart',
    'Coffee',
    'Home',
    'Car',
    'Utensils',
    'Heart',
    'Shirt',
    'Plane',
    'Briefcase',
    'GraduationCap',
    'Smartphone',
    'Gamepad',
    'Music',
    'Film',
    'Book',
    'Dumbbell',
];

export function CategoryFormModal({ open, onOpenChange, category, onSuccess }: CategoryFormProps) {
    const isEditing = !!category;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: category?.name || '',
            color: category?.color || DEFAULT_COLORS[0],
            icon: category?.icon || '',
        },
    });

    const selectedColor = watch('color');
    const selectedIcon = watch('icon');

    useEffect(() => {
        if (category) {
            reset({
                name: category.name,
                color: category.color,
                icon: category.icon || '',
            });
        } else {
            reset({
                name: '',
                color: DEFAULT_COLORS[0],
                icon: '',
            });
        }
    }, [category, reset]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            if (isEditing) {
                const result = await updateCategory({
                    id: category.id,
                    name: data.name,
                    color: data.color,
                    icon: data.icon || null,
                });

                if (result.success) {
                    toast.success('Category updated successfully');
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || 'Failed to update category');
                }
            } else {
                const result = await createCategory({
                    name: data.name,
                    color: data.color,
                    icon: data.icon,
                });

                if (result.success) {
                    toast.success('Category created successfully');
                    onSuccess();
                    onOpenChange(false);
                    reset();
                } else {
                    toast.error(result.error || 'Failed to create category');
                }
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const IconComponent = selectedIcon
        ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[selectedIcon]
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Category' : 'Create Category'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your custom category.'
                            : 'Create a new category to organize your transactions.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Groceries"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`h-10 w-10 rounded-full border-2 transition-all ${selectedColor === color
                                            ? 'scale-110 border-foreground ring-2 ring-offset-2'
                                            : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setValue('color', color)}
                                    title={color}
                                />
                            ))}
                        </div>
                        {errors.color && (
                            <p className="text-sm text-destructive">{errors.color.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Icon (Optional)</Label>
                        <div className="grid grid-cols-8 gap-2">
                            {POPULAR_ICONS.map((iconName) => {
                                const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
                                if (!Icon) return null;

                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        className={`h-10 w-10 flex items-center justify-center rounded-lg border-2 transition-all ${selectedIcon === iconName
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50 hover:bg-muted'
                                            }`}
                                        onClick={() => setValue('icon', iconName)}
                                        title={iconName}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                        {selectedIcon && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {IconComponent && <IconComponent className="h-4 w-4" />}
                                <span>Selected: {selectedIcon}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setValue('icon', '')}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <div
                            className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: selectedColor }}
                        >
                            {IconComponent ? (
                                <IconComponent className="h-6 w-6 text-white" />
                            ) : (
                                <LucideIcons.Tag className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {watch('name') || 'Category Name'}
                            </p>
                            <p className="text-sm text-muted-foreground">Preview</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : isEditing
                                    ? 'Update'
                                    : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
