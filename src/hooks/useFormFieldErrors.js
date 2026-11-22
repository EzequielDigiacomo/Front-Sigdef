import { useCallback, useState } from 'react';
import {
    mapApiFieldErrors,
    scrollToFirstFieldError,
    summarizeFieldErrors,
} from '../utils/formFieldErrors';

/**
 * Estado de errores por campo para formularios create/edit.
 */
export default function useFormFieldErrors(labels = {}) {
    const [fieldErrors, setFieldErrors] = useState({});

    const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

    const clearFieldError = useCallback((name) => {
        if (!name) return;
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }, []);

    const setFieldError = useCallback((name, message) => {
        if (!name) return;
        setFieldErrors((prev) => ({ ...prev, [name]: message }));
    }, []);

    const applyApiError = useCallback((error, extraMap = {}) => {
        const mapped = mapApiFieldErrors(error, extraMap);
        if (Object.keys(mapped).length) {
            setFieldErrors(mapped);
            scrollToFirstFieldError(mapped);
            return mapped;
        }
        return {};
    }, []);

    const applyErrors = useCallback((errors, { scroll = true } = {}) => {
        const next = errors || {};
        setFieldErrors(next);
        if (scroll && Object.keys(next).length) scrollToFirstFieldError(next);
        return next;
    }, []);

    const getFieldError = useCallback((name) => fieldErrors[name] || '', [fieldErrors]);

    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    const summaryLines = summarizeFieldErrors(fieldErrors, labels);

    return {
        fieldErrors,
        setFieldErrors,
        clearFieldErrors,
        clearFieldError,
        setFieldError,
        applyApiError,
        applyErrors,
        getFieldError,
        hasFieldErrors,
        summaryLines,
    };
}
