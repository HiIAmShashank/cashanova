/**
 * Validation Helper Functions
 * Provides reusable validation logic for forms
 */

/**
 * Validates if email format is correct
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates if password meets security requirements
 * @param password - Password string to validate
 * @returns Object with isValid and error message
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
}

/**
 * Validates if a date is not in the future
 * @param date - Date object to validate
 * @returns true if date is today or in the past
 */
export function isNotFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today;
}

/**
 * Validates if a date is in the future
 * @param date - Date object to validate
 * @returns true if date is after today
 */
export function isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return date > today;
}

/**
 * Validates if an amount is positive and has max 2 decimal places
 * @param amount - Number to validate
 * @returns Object with isValid and error message
 */
export function validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount <= 0) {
        return { isValid: false, error: 'Amount must be greater than zero' };
    }

    // Check if has more than 2 decimal places
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
        return { isValid: false, error: 'Amount must have at most 2 decimal places' };
    }

    return { isValid: true };
}

/**
 * Validates if a hex color code is valid
 * @param color - Hex color string to validate
 * @returns true if valid hex color (#RRGGBB)
 */
export function isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexColorRegex.test(color);
}

/**
 * Sanitizes user input by trimming and removing extra whitespace
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validates if a string is not empty after trimming
 * @param value - String to validate
 * @returns true if string has content after trimming
 */
export function hasContent(value: string): boolean {
    return value.trim().length > 0;
}
