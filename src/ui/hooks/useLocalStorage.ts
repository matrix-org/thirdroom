import { useCallback, useEffect, useState } from "react";

function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(key);
  if (item === null) return defaultValue;
  if (item === "undefined") return undefined as T;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((previousValue: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState(() => getLocalStorageItem(key, defaultValue));

  useEffect(() => {
    const handleStorageChange = (evt: StorageEvent) => {
      if (evt.key !== key) return;
      setStoredValue(getLocalStorageItem(key, defaultValue));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T | ((previousValue: T) => T)) => {
      try {
        const item = value instanceof Function ? value(getLocalStorageItem(key, defaultValue)) : value;
        localStorage.setItem(key, JSON.stringify(item));
        setStoredValue(item);
      } catch (err) {
        console.warn(`Error setting local storage! key: ${key}`, err);
      }
    },
    [key, defaultValue]
  );

  return [storedValue, setValue];
}
