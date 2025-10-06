import Papa from 'papaparse';

export interface ParsedTransaction {
    tempId: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    categoryId?: string | null;
    originalParticulars: string;
    isSelected: boolean;
}

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

export async function parseCSV(file: File): Promise<{
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

                        for (const row of results.data) {
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

                            if (!dateValue || !descValue || !amountValue) continue;

                            const amount = Math.abs(
                                parseFloat(amountValue.replace(/[^0-9.-]/g, ''))
                            );
                            if (isNaN(amount) || amount === 0) continue;

                            // Determine transaction type
                            let type: 'credit' | 'debit' = 'debit';
                            if (typeValue) {
                                type = typeValue.toLowerCase().includes('credit')
                                    ? 'credit'
                                    : 'debit';
                            } else if (row.Debit || row.debit) {
                                type = 'debit';
                            } else if (row.Credit || row.credit) {
                                type = 'credit';
                            } else {
                                // Use amount sign or description to determine
                                const rawAmount = parseFloat(amountValue.replace(/[^0-9.-]/g, ''));
                                if (rawAmount < 0) {
                                    type = 'debit';
                                } else {
                                    type = determineTransactionType(amount, descValue);
                                }
                            }

                            transactions.push({
                                tempId: crypto.randomUUID(),
                                date: parseDate(dateValue),
                                description: cleanDescription(descValue),
                                amount,
                                type,
                                categoryId: null,
                                originalParticulars: descValue,
                                isSelected: true,
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
