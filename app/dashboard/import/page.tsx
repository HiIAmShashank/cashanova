'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { getCategories } from '@/lib/actions/categories';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { ParsedTransaction } from '@/lib/utils/csv-parser';

// Dynamic imports for heavy components
const UploadStatementForm = lazy(() =>
    import('@/components/import/upload-statement-form').then((mod) => ({
        default: mod.UploadStatementForm,
    }))
);

const ImportPreview = lazy(() =>
    import('@/components/import/import-preview').then((mod) => ({
        default: mod.ImportPreview,
    }))
);

// Loading fallback for dynamic imports
function ImportLoadingFallback() {
    return (
        <Card>
            <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
    );
}

export default function ImportPage() {
    const [parsedData, setParsedData] = useState<{
        transactions: ParsedTransaction[];
        summary: {
            totalTransactions: number;
            totalCredits: number;
            totalDebits: number;
            dateRange: {
                start: string;
                end: string;
            };
        };
    } | null>(null);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; icon?: string }>>([]);
    const { toast } = useToast();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const result = await getCategories();
        if (result.success) {
            setCategories(result.data.categories);
        }
    };

    const handleParseSuccess = (data: {
        transactions: ParsedTransaction[];
        summary: {
            totalTransactions: number;
            totalCredits: number;
            totalDebits: number;
            dateRange: { start: string; end: string };
        };
    }) => {
        setParsedData(data);
    };

    const handleImportComplete = () => {
        setParsedData(null);
        toast({
            title: 'Import complete',
            description: 'Transactions have been imported successfully',
        });
    };

    const handleBack = () => {
        setParsedData(null);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Import Statements</h1>
                <p className="text-muted-foreground">Upload and import CSV bank statements</p>
            </div>

            <Suspense fallback={<ImportLoadingFallback />}>
                {parsedData ? (
                    <ImportPreview
                        parsedData={parsedData}
                        categories={categories}
                        onBack={handleBack}
                        onComplete={handleImportComplete}
                    />
                ) : (
                    <UploadStatementForm onParseSuccess={handleParseSuccess} />
                )}
            </Suspense>
        </div>
    );
}

