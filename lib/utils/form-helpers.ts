/**
 * Form Helper Utilities
 * Provides UTC conversion, date formatting, and form data helpers
 */

import { format, parse, isValid } from 'date-fns';

/**
 * Converts a local Date object to UTC for database storage
 * @param localDate - Date in user's local timezone
 * @returns ISO string in UTC format
 */
export function convertToUTC(localDate: Date): string {
    return localDate.toISOString();
}

/**
 * Converts a Date object to YYYY-MM-DD format for database storage
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDB(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Converts a Date object to the first day of the month in YYYY-MM-DD format
 * Used for budget month storage
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-01 format (first day of month)
 */
export function formatMonthForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

/**
 * Converts a UTC date string from database to local Date object
 * @param utcString - ISO string from database (UTC)
 * @returns Date object in user's local timezone
 */
export function convertFromUTC(utcString: string): Date {
    return new Date(utcString);
}

/**
 * Formats a Date object to dd-mm-yyyy string
 * @param date - Date object to format
 * @returns Formatted string in dd-mm-yyyy format
 */
export function formatDateForDisplay(date: Date): string {
    return format(date, 'dd-MM-yyyy');
}

/**
 * Parses a dd-mm-yyyy string to a Date object
 * @param dateString - String in dd-mm-yyyy format
 * @returns Date object or null if invalid
 */
export function parseDateFromInput(dateString: string): Date | null {
    const parsed = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsed) ? parsed : null;
}

/**
 * Validates if a string matches dd-mm-yyyy format
 * @param dateString - String to validate
 * @returns true if valid dd-mm-yyyy format
 */
export function isValidDateFormat(dateString: string): boolean {
    const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    if (!regex.test(dateString)) return false;

    const parsed = parseDateFromInput(dateString);
    return parsed !== null;
}

/**
 * Converts form data amount (number) to database format (string with 2 decimals)
 * @param amount - Number from form
 * @returns String formatted to 2 decimal places
 */
export function formatAmountForDB(amount: number): string {
    return amount.toFixed(2);
}

/**
 * Converts database amount (string) to form format (number)
 * @param amountString - String from database
 * @returns Number for form input
 */
export function parseAmountFromDB(amountString: string): number {
    return parseFloat(amountString);
}

/**
 * Extracts first error message from Zod errors for a field
 * @param errors - React Hook Form errors object
 * @param fieldName - Name of the field
 * @returns First error message or undefined
 */
export function getFieldError(errors: Record<string, { message?: string }>, fieldName: string): string | undefined {
    return errors?.[fieldName]?.message;
}
