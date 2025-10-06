/**
 * Centralized Error Messages
 * Defines all user-facing error messages for consistency
 */

export const ERROR_MESSAGES = {
    // Auth errors
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        EMAIL_EXISTS: 'An account with this email already exists',
        WEAK_PASSWORD: 'Password must be at least 8 characters',
        PASSWORDS_MISMATCH: 'Passwords do not match',
        EMAIL_REQUIRED: 'Email is required',
        PASSWORD_REQUIRED: 'Password is required',
        RESET_LINK_SENT: 'Password reset link sent to your email',
        RESET_FAILED: 'Failed to send reset link. Please try again.',
    },

    // Transaction errors
    TRANSACTION: {
        DATE_REQUIRED: 'Transaction date is required',
        DATE_FUTURE: 'Transaction date cannot be in the future',
        DATE_INVALID_FORMAT: 'Please enter date in dd-mm-yyyy format',
        DESCRIPTION_REQUIRED: 'Description is required',
        DESCRIPTION_TOO_LONG: 'Description must be less than 200 characters',
        AMOUNT_REQUIRED: 'Amount is required',
        AMOUNT_INVALID: 'Amount must be greater than zero',
        AMOUNT_DECIMALS: 'Amount must have at most 2 decimal places',
        CATEGORY_REQUIRED: 'Please select a category',
        TYPE_REQUIRED: 'Transaction type is required',
        SAVE_FAILED: 'Failed to save transaction. Please try again.',
    },

    // Budget errors
    BUDGET: {
        MONTH_REQUIRED: 'Month is required',
        CATEGORY_REQUIRED: 'Please select a category',
        LIMIT_REQUIRED: 'Budget limit is required',
        LIMIT_INVALID: 'Budget limit must be greater than zero',
        LIMIT_DECIMALS: 'Budget limit must have at most 2 decimal places',
        ALREADY_EXISTS: 'Budget for this month and category already exists',
        SAVE_FAILED: 'Failed to save budget. Please try again.',
    },

    // Goal errors
    GOAL: {
        NAME_REQUIRED: 'Goal name is required',
        NAME_TOO_LONG: 'Goal name must be less than 100 characters',
        TARGET_AMOUNT_REQUIRED: 'Target amount is required',
        TARGET_AMOUNT_INVALID: 'Target amount must be greater than zero',
        CURRENT_AMOUNT_NEGATIVE: 'Current amount cannot be negative',
        CURRENT_EXCEEDS_TARGET: 'Current amount cannot exceed target amount',
        TARGET_DATE_REQUIRED: 'Target date is required',
        TARGET_DATE_PAST: 'Target date must be in the future',
        TARGET_DATE_INVALID_FORMAT: 'Please enter date in dd-mm-yyyy format',
        DESCRIPTION_TOO_LONG: 'Description must be less than 500 characters',
        COLOR_INVALID: 'Invalid color format',
        SAVE_FAILED: 'Failed to save goal. Please try again.',
    },

    // CSV Import errors
    CSV: {
        FILE_REQUIRED: 'Please select a file to upload',
        FILE_TOO_LARGE: 'File size must be less than 5MB',
        INVALID_FORMAT: 'Invalid CSV format. Please check the file.',
        PARSING_FAILED: 'Failed to parse CSV file',
        VALIDATION_FAILED: 'Some transactions have validation errors',
        UPLOAD_FAILED: 'Failed to upload file. Please try again.',
    },

    // Network/API errors
    NETWORK: {
        CONNECTION_ERROR: 'Connection error. Please check your internet.',
        SERVER_ERROR: 'Server error. Please try again later.',
        TIMEOUT: 'Request timed out. Please try again.',
        UNKNOWN: 'An unexpected error occurred. Please try again.',
    },
} as const;

/**
 * Gets a user-friendly error message from Supabase error
 * @param error - Error object from Supabase
 * @returns User-friendly error message
 */
export function getSupabaseErrorMessage(error: unknown): string {
    // Type guard for error object
    const isErrorWithCode = (e: unknown): e is { code?: string } => {
        return typeof e === 'object' && e !== null && 'code' in e;
    };

    const isErrorWithMessage = (e: unknown): e is { message?: string } => {
        return typeof e === 'object' && e !== null && 'message' in e;
    };

    // Check for specific error codes
    if (isErrorWithCode(error) && error.code === '23505') {
        return 'This record already exists';
    }

    if (isErrorWithCode(error) && error.code === 'PGRST116') {
        return 'Record not found';
    }

    // Check for auth errors
    if (isErrorWithMessage(error) && error.message?.includes('Invalid login credentials')) {
        return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    }

    if (isErrorWithMessage(error) && error.message?.includes('User already registered')) {
        return ERROR_MESSAGES.AUTH.EMAIL_EXISTS;
    }

    // Return the error message or fallback
    if (isErrorWithMessage(error) && error.message) {
        return error.message;
    }

    return ERROR_MESSAGES.NETWORK.UNKNOWN;
}
