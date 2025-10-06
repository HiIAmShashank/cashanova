/**
 * DatePicker Component
 * Supports both manual dd-mm-yyyy entry and calendar selection
 * Handles UTC conversion for database storage
 */

'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
    formatDateForDisplay,
    parseDateFromInput,
    isValidDateFormat,
} from '@/lib/utils/form-helpers';

interface DatePickerProps {
    /** Current selected date */
    value?: Date;
    /** Callback when date changes */
    onChange: (date: Date | undefined) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Error state */
    error?: boolean;
    /** Minimum selectable date */
    minDate?: Date;
    /** Maximum selectable date */
    maxDate?: Date;
    /** ARIA label for accessibility */
    ariaLabel?: string;
    /** ID for form field association */
    id?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'dd-mm-yyyy',
    disabled = false,
    error = false,
    minDate,
    maxDate,
    ariaLabel = 'Select date',
    id,
}: DatePickerProps) {
    const [inputValue, setInputValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputError, setInputError] = React.useState(false);

    // Sync input value with selected date
    React.useEffect(() => {
        if (value) {
            setInputValue(formatDateForDisplay(value));
            setInputError(false);
        } else {
            setInputValue('');
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Clear error while typing
        setInputError(false);

        // Only validate and update if user has entered complete format
        if (newValue.length === 10) {
            if (isValidDateFormat(newValue)) {
                const parsed = parseDateFromInput(newValue);
                if (parsed) {
                    // Check date bounds
                    if (minDate && parsed < minDate) {
                        setInputError(true);
                        return;
                    }
                    if (maxDate && parsed > maxDate) {
                        setInputError(true);
                        return;
                    }

                    onChange(parsed);
                    setInputError(false);
                } else {
                    setInputError(true);
                }
            } else {
                setInputError(true);
            }
        }
    };

    const handleInputBlur = () => {
        // Validate on blur
        if (inputValue && inputValue.length > 0) {
            if (!isValidDateFormat(inputValue)) {
                setInputError(true);
            }
        }
    };

    const handleCalendarSelect = (date: Date | undefined) => {
        onChange(date);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInputValue('');
        onChange(undefined);
        setInputError(false);
    };

    return (
        <div className="flex gap-2">
            <Input
                id={id}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'flex-1',
                    (error || inputError) && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-label={ariaLabel}
                aria-invalid={error || inputError}
                aria-describedby={inputError ? `${id}-error` : undefined}
                maxLength={10}
            />

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'px-3',
                            (error || inputError) && 'border-red-500'
                        )}
                        aria-label="Open calendar"
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleCalendarSelect}
                        disabled={(date) => {
                            if (disabled) return true;
                            if (minDate && date < minDate) return true;
                            if (maxDate && date > maxDate) return true;
                            return false;
                        }}
                        initialFocus
                    />
                    {value && (
                        <div className="p-3 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="w-full"
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {inputError && (
                <span id={`${id}-error`} className="sr-only">
                    Invalid date format. Please use dd-mm-yyyy.
                </span>
            )}
        </div>
    );
}
