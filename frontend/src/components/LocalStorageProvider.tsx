'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface LocalStorageContextType {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextType>({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

export function useLocalStorage() {
  return useContext(LocalStorageContext);
}

export function LocalStorageProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getItem = (key: string): string | null => {
    if (!isClient) return null;
    return localStorage.getItem(key);
  };

  const setItem = (key: string, value: string): void => {
    if (!isClient) return;
    localStorage.setItem(key, value);
  };

  const removeItem = (key: string): void => {
    if (!isClient) return;
    localStorage.removeItem(key);
  };

  return (
    <LocalStorageContext.Provider value={{ getItem, setItem, removeItem }}>
      {children}
    </LocalStorageContext.Provider>
  );
} 