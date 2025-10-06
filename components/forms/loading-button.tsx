/**
 * LoadingButton Component
 * Button with loading spinner state for form submissions
 */

'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
    /** Loading state */
    loading?: boolean;
    /** Loading text to display */
    loadingText?: string;
    /** Icon to show when not loading */
    icon?: React.ReactNode;
}

export const LoadingButton = React.forwardRef<
    HTMLButtonElement,
    LoadingButtonProps
>(
    (
        {
            children,
            loading = false,
            loadingText,
            icon,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <Button
                ref={ref}
                disabled={disabled || loading}
                className={cn(className)}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>{loadingText || children}</span>
                    </>
                ) : (
                    <>
                        {icon && <span className="mr-2">{icon}</span>}
                        {children}
                    </>
                )}
            </Button>
        );
    }
);

LoadingButton.displayName = 'LoadingButton';
