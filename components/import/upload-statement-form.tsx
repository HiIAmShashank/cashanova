'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { parseCSV, type ParsedTransaction } from '@/lib/utils/csv-parser';

interface UploadStatementFormProps {
    onParseSuccess: (data: {
        transactions: ParsedTransaction[];
        summary: {
            totalTransactions: number;
            totalCredits: number;
            totalDebits: number;
            dateRange: { start: string; end: string };
        };
    }) => void;
}

export function UploadStatementForm({ onParseSuccess }: UploadStatementFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const { toast } = useToast();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
            } else {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload a CSV file',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
            } else {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload a CSV file',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleDownloadSample = () => {
        // Create sample CSV content
        const sampleCSV = `Date,Description,Amount,Type
01/10/2025,Salary Payment,5000.00,credit
02/10/2025,Grocery Shopping,150.50,debit
03/10/2025,Freelance Income,800.00,credit
04/10/2025,Electric Bill,120.00,debit
05/10/2025,Restaurant,45.75,debit
06/10/2025,Gas Station,60.00,debit
07/10/2025,Online Shopping,89.99,debit
08/10/2025,Client Payment,1200.00,credit
09/10/2025,Rent Payment,1500.00,debit
10/10/2025,Refund,35.00,credit`;

        // Create blob and download
        const blob = new Blob([sampleCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample-bank-statement.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Sample downloaded',
            description: 'Use this template to format your bank statement',
        });
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: 'No file selected',
                description: 'Please select a CSV file to upload',
                variant: 'destructive',
            });
            return;
        }

        setIsParsing(true);

        try {
            const result = await parseCSV(file);

            if (result.success && result.data) {
                toast({
                    title: 'CSV parsed successfully',
                    description: `Found ${result.data.transactions.length} transactions`,
                });
                setFile(null);
                onParseSuccess(result.data);
            } else {
                toast({
                    title: 'Parse failed',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch {
            toast({
                title: 'Parse failed',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Bank Statement</CardTitle>
                <CardDescription>Upload a CSV bank statement to import transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                        <p className="text-sm font-medium">Need a template?</p>
                        <p className="text-xs text-muted-foreground">
                            Download a sample CSV to see the required format
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSample}
                        className="ml-4"
                        aria-label="Download sample CSV template"
                    >
                        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                        Sample CSV
                    </Button>
                </div>

                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        } ${isParsing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !isParsing && document.getElementById('file-upload')?.click()}
                    role="button"
                    tabIndex={isParsing ? -1 : 0}
                    onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isParsing) {
                            e.preventDefault();
                            document.getElementById('file-upload')?.click();
                        }
                    }}
                    aria-label="Upload CSV file by dragging and dropping or clicking to browse"
                    aria-disabled={isParsing}
                >
                    <input
                        id="file-upload"
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isParsing}
                        aria-label="Choose CSV file to upload"
                    />
                    <div className="flex flex-col items-center gap-2">
                        {file ? (
                            <>
                                <FileText className="h-12 w-12 text-primary" aria-hidden="true" />
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                                <p className="text-sm font-medium">
                                    Drag and drop your CSV here, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                            </>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={!file || isParsing}
                    className="w-full"
                    aria-label={isParsing ? 'Parsing CSV file' : 'Parse and import bank statement'}
                >
                    {isParsing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Parsing CSV...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                            Parse & Import Statement
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
