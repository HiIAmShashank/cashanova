import Papa from 'papaparse';
import { z } from 'zod';

export interface ParsedTransaction {
    tempId: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    categoryId?: string | null;
    originalParticulars: string;
    isSelected: boolean;
    rowNumber: number;
    validationErrors: ValidationError[];
    isValid: boolean;
}

export interface ValidationError {
    field: string;
    message: string;
}

export type ProgressCallback = (current: number, total: number) => void;

// Validation schema for CSV transaction rows
const CSVTransactionSchema = z.object({
    date: z.string().refine((dateStr) => {
        const parsed = parseDate(dateStr);
        const date = new Date(parsed);
        if (isNaN(date.getTime())) return false;
        
        // Compare dates only (not time) to avoid timezone issues
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
    }, 'Invalid date or date in the future'),
    description: z.string()
        .trim()
        .min(1, 'Description is required')
        .max(200, 'Description must be less than 200 characters'),
    amount: z.number()
        .positive('Amount must be greater than zero')
        .refine((n) => Number.isFinite(n) && n < 1000000000000, 'Amount too large')
        .refine(
            (n) => Number((n * 100).toFixed(0)) / 100 === n,
            'Amount must have at most 2 decimal places'
        ),
    type: z.enum(['credit', 'debit'], { message: "Type must be 'credit' or 'debit'" }),
});

function validateTransaction(transaction: Omit<ParsedTransaction, 'tempId' | 'rowNumber' | 'validationErrors' | 'isValid'>): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
        CSVTransactionSchema.parse({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue: z.ZodIssue) => {
                errors.push({
                    field: issue.path.join('.'),
                    message: issue.message,
                });
            });
        }
    }

    return errors;
}

export { validateTransaction };

function parseDate(dateStr: string): string {
    // Handle multiple date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const formats = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    ];

    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format === formats[2]) {
                // YYYY-MM-DD is already in ISO format
                return dateStr;
            }
            // DD/MM/YYYY or DD-MM-YYYY -> YYYY-MM-DD
            const [, day, month, year] = match;
            return `${year}-${month}-${day}`;
        }
    }

    // Fallback to current date if parsing fails
    return new Date().toISOString().split('T')[0];
}

function cleanDescription(text: string): string {
    return text
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/[^\w\s\-.,&()']/g, '') // Remove special chars except common ones
        .trim()
        .slice(0, 500); // Limit to 500 characters
}

function determineTransactionType(
    amount: number,
    description: string
): 'credit' | 'debit' {
    // Fallback: check description for indicators
    const creditIndicators = ['salary', 'deposit', 'transfer in', 'refund', 'cr', 'income'];
    const debitIndicators = ['withdrawal', 'payment', 'purchase', 'transfer out', 'dr', 'expense'];

    const lowerDesc = description.toLowerCase();

    if (creditIndicators.some((ind) => lowerDesc.includes(ind))) {
        return 'credit';
    }
    if (debitIndicators.some((ind) => lowerDesc.includes(ind))) {
        return 'debit';
    }

    // Default to debit if unknown
    return 'debit';
}

export async function parseCSV(
    file: File,
    onProgress?: ProgressCallback
): Promise<{
    success: boolean;
    data?: {
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
        validation: {
            validCount: number;
            errorCount: number;
            totalRows: number;
        };
    };
    error?: string;
}> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const csvText = e.target?.result as string;

            Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const transactions: ParsedTransaction[] = [];
                        const totalRows = results.data.length;
                        let processedRows = 0;

                        for (let i = 0; i < results.data.length; i++) {
                            const row = results.data[i];
                            processedRows++;

                            // Report progress
                            if (onProgress && (processedRows % 10 === 0 || processedRows === totalRows)) {
                                onProgress(processedRows, totalRows);
                            }
                            // Try to detect common CSV column names
                            const dateValue =
                                row.Date ||
                                row.date ||
                                row['Transaction Date'] ||
                                row['Posting Date'] ||
                                row.DATE ||
                                '';

                            const descValue =
                                row.Description ||
                                row.description ||
                                row.Particulars ||
                                row.particulars ||
                                row.Details ||
                                row.details ||
                                row.DESCRIPTION ||
                                '';

                            const amountValue =
                                row.Amount ||
                                row.amount ||
                                row.AMOUNT ||
                                row.Debit ||
                                row.debit ||
                                row.Credit ||
                                row.credit ||
                                '';

                            const typeValue = row.Type || row.type || row.TYPE || '';

                            // Don't skip rows - validate them instead
                            // Parse amount first (keep original sign for validation)
                            const rawAmountStr = amountValue.replace(/[^0-9.-]/g, '');
                            const parsedAmount = parseFloat(rawAmountStr);
                            const amount = isNaN(parsedAmount) ? 0 : Math.abs(parsedAmount);
                            
                            // Determine transaction type
                            let type: 'credit' | 'debit' = 'debit';
                            if (typeValue) {
                                const typeLower = typeValue.toLowerCase();
                                if (typeLower === 'credit' || typeLower === 'debit') {
                                    type = typeLower as 'credit' | 'debit';
                                } else if (typeLower.includes('credit')) {
                                    type = 'credit';
                                } else if (typeLower.includes('debit')) {
                                    type = 'debit';
                                }
                                // If neither, keep as debit (validation will catch invalid type)
                            } else if (row.Debit || row.debit) {
                                type = 'debit';
                            } else if (row.Credit || row.credit) {
                                type = 'credit';
                            } else {
                                // Use amount sign or description to determine
                                if (parsedAmount < 0) {
                                    type = 'debit';
                                } else {
                                    type = determineTransactionType(amount, descValue);
                                }
                            }

                            const transaction = {
                                date: parseDate(dateValue),
                                description: cleanDescription(descValue),
                                amount: amount, // Always positive for storage, validation checks this
                                type,
                                categoryId: null,
                                originalParticulars: descValue,
                                isSelected: true,
                            };

                            const validationErrors = validateTransaction(transaction);

                            transactions.push({
                                ...transaction,
                                tempId: crypto.randomUUID(),
                                rowNumber: i + 2, // +2 because CSV has header row and is 1-indexed
                                validationErrors,
                                isValid: validationErrors.length === 0,
                            });
                        }

                        if (transactions.length === 0) {
                            resolve({
                                success: false,
                                error: 'No valid transactions found in CSV file',
                            });
                            return;
                        }

                        // Calculate summary
                        const dates = transactions.map((t) => t.date).sort();
                        const totalCredits = transactions
                            .filter((t) => t.type === 'credit')
                            .reduce((sum, t) => sum + t.amount, 0);
                        const totalDebits = transactions
                            .filter((t) => t.type === 'debit')
                            .reduce((sum, t) => sum + t.amount, 0);

                        const validCount = transactions.filter(t => t.isValid).length;
                        const errorCount = transactions.filter(t => !t.isValid).length;

                        const summary = {
                            totalTransactions: transactions.length,
                            totalCredits,
                            totalDebits,
                            dateRange: {
                                start: dates[0] || new Date().toISOString().split('T')[0],
                                end:
                                    dates[dates.length - 1] ||
                                    new Date().toISOString().split('T')[0],
                            },
                        };

                        resolve({
                            success: true,
                            data: {
                                transactions,
                                summary,
                                validation: {
                                    validCount,
                                    errorCount,
                                    totalRows: transactions.length,
                                },
                            },
                        });
                    } catch {
                        resolve({
                            success: false,
                            error: 'Failed to parse CSV file',
                        });
                    }
                },
                error: () => {
                    resolve({
                        success: false,
                        error: 'Failed to read CSV file',
                    });
                },
            });
        };

        reader.onerror = () => {
            resolve({
                success: false,
                error: 'Failed to read file',
            });
        };

        reader.readAsText(file);
    });
}
