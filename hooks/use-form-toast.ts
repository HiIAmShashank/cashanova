/**
 * useFormToast Hook
 * Provides consistent toast notifications for form operations
 * Error toasts: 5-second duration, dismissable
 * Success toasts: 3-5 second duration based on message length
 */

import { toast } from 'sonner';

interface FormToastOptions {
    /** Optional description for the toast */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function useFormToast() {
    /**
     * Shows a success toast
     * Duration: 3-5 seconds based on message length
     */
    const showSuccess = (message: string, options?: FormToastOptions) => {
        const duration = message.length > 50 ? 5000 : 3000;

        toast.success(message, {
            description: options?.description,
            duration,
            action: options?.action,
        });
    };

    /**
     * Shows an error toast
     * Duration: 5 seconds (always), dismissable
     */
    const showError = (message: string, options?: FormToastOptions) => {
        toast.error(message, {
            description: options?.description,
            duration: 5000, // Fixed 5-second duration per requirements
            dismissible: true,
            action: options?.action,
        });
    };

    /**
     * Shows a loading toast
     * Returns toast ID for later dismissal
     */
    const showLoading = (message: string) => {
        return toast.loading(message);
    };

    /**
     * Shows a warning toast
     * Duration: 4 seconds
     */
    const showWarning = (message: string, options?: FormToastOptions) => {
        toast.warning(message, {
            description: options?.description,
            duration: 4000,
            action: options?.action,
        });
    };

    /**
     * Shows an info toast
     * Duration: 3 seconds
     */
    const showInfo = (message: string, options?: FormToastOptions) => {
        toast.info(message, {
            description: options?.description,
            duration: 3000,
            action: options?.action,
        });
    };

    /**
     * Dismisses a specific toast by ID
     */
    const dismiss = (toastId: string | number) => {
        toast.dismiss(toastId);
    };

    /**
     * Dismisses all active toasts
     */
    const dismissAll = () => {
        toast.dismiss();
    };

    return {
        showSuccess,
        showError,
        showLoading,
        showWarning,
        showInfo,
        dismiss,
        dismissAll,
    };
}
