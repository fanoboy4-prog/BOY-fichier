import { useCallback, useEffect, useState } from 'react';

const BLOCKED_KEY = 'lt_blocked_numbers';

function load(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

export function useBlockedNumbers() {
  const [blocked, setBlocked] = useState<string[]>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
    } catch {
      // ignore
    }
  }, [blocked]);

  const blockNumber = useCallback((phone: string) => {
    setBlocked((prev) => (prev.includes(phone) ? prev : [...prev, phone]));
  }, []);

  const unblockNumber = useCallback((phone: string) => {
    setBlocked((prev) => prev.filter((p) => p !== phone));
  }, []);

  return { blocked, blockNumber, unblockNumber };
}
