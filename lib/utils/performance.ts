/**
 * Performance Utilities
 * 
 * Collection of utility functions and hooks for optimizing
 * performance in the application.
 */

import { useEffect, useRef } from 'react';

/**
 * Debounce hook for expensive operations
 * Useful for search inputs, window resize handlers, etc.
 * 
 * @param callback Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

/**
 * Throttle hook for rate-limiting function calls
 * Useful for scroll handlers, API calls, etc.
 * 
 * @param callback Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
    callback: T,
    limit: number
): (...args: Parameters<T>) => void {
    const inThrottle = useRef(false);

    return (...args: Parameters<T>) => {
        if (!inThrottle.current) {
            callback(...args);
            inThrottle.current = true;
            setTimeout(() => {
                inThrottle.current = false;
            }, limit);
        }
    };
}

/**
 * Shared number formatters to avoid recreating instances
 */
export const formatters = {
    currency: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }),

    currencyCompact: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
    }),

    number: new Intl.NumberFormat('en-US'),

    percent: new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    }),

    date: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }),

    dateShort: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }),

    dateLong: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }),
};

/**
 * Format currency with shared formatter
 */
export function formatCurrency(amount: number): string {
    return formatters.currency.format(amount);
}

/**
 * Format currency in compact notation (e.g., $1.2K)
 */
export function formatCurrencyCompact(amount: number): string {
    return formatters.currencyCompact.format(amount);
}

/**
 * Format number with thousands separators
 */
export function formatNumber(value: number): string {
    return formatters.number.format(value);
}

/**
 * Format percentage (0-1 range to percentage)
 */
export function formatPercent(value: number): string {
    return formatters.percent.format(value);
}

/**
 * Format date (short format: Jan 15, 2025)
 */
export function formatDate(date: string | Date): string {
    return formatters.date.format(new Date(date));
}

/**
 * Format date (short format without year: Jan 15)
 */
export function formatDateShort(date: string | Date): string {
    return formatters.dateShort.format(new Date(date));
}

/**
 * Format date (long format: Monday, January 15, 2025)
 */
export function formatDateLong(date: string | Date): string {
    return formatters.dateLong.format(new Date(date));
}

/**
 * Simple cache for expensive calculations
 */
export class SimpleCache<T> {
    private cache = new Map<string, { value: T; timestamp: number }>();
    private ttl: number;

    constructor(ttlMs: number = 60000) {
        this.ttl = ttlMs;
    }

    get(key: string): T | undefined {
        const cached = this.cache.get(key);
        if (!cached) return undefined;

        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        return cached.value;
    }

    set(key: string, value: T): void {
        this.cache.set(key, { value, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }
}
