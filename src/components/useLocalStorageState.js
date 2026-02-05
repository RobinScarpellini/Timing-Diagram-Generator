import { useEffect, useState } from 'react';

export const useLocalStorageState = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Ignore storage failures (private mode, quota, etc.)
        }
    }, [key, value]);

    return [value, setValue];
};

