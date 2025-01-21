'use client';

import { useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

function getStorageValue<T>(key: string, defaultValue: T): T {
  if (!isBrowser) {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  // Initialize with a function to avoid unnecessary JSON parsing on every render
  const [state, setState] = useState<T>(() => getStorageValue(key, defaultValue));
  const [isInitialized, setIsInitialized] = useState(isBrowser);

  // Update localStorage when the state changes
  useEffect(() => {
    if (!isBrowser || !isInitialized) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state, isInitialized]);

  return [state, setState] as const;
} 