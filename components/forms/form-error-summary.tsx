/**
 * FormErrorSummary Component
 * Displays a summary of all form errors for accessibility
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */

'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FormError {
    /** Field name/ID */
    field: string;
    /** Field label for display */
    label: string;
    /** Error message */
    message: string;
}

export type { FormError };

interface FormErrorSummaryProps {
    /** Array of form errors */
    errors: FormError[];
    /** Title for the error summary */
    title?: string;
    /** Additional CSS classes */
    className?: string;
    /** Callback when error is clicked (for focus management) */
    onErrorClick?: (field: string) => void;
}

export function FormErrorSummary({
    errors,
    title = 'Please fix the following errors:',
    className,
    onErrorClick,
}: FormErrorSummaryProps) {
    const summaryRef = React.useRef<HTMLDivElement>(null);

    // Auto-focus on error summary when errors appear
    React.useEffect(() => {
        if (errors.length > 0 && summaryRef.current) {
            summaryRef.current.focus();
            summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [errors.length]);

    if (errors.length === 0) {
        return null;
    }

    return (
        <Alert
            ref={summaryRef}
            variant="destructive"
            className={cn('mb-6', className)}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
        >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="font-semibold">{title}</AlertTitle>
            <AlertDescription>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                    {errors.map((error) => (
                        <li key={error.field}>
                            <span className="font-medium">{error.label}:</span> {error.message}
                        </li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
