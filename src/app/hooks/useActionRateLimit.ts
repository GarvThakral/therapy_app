import { useCallback, useRef } from 'react';

export function useActionRateLimit(waitMs: number) {
  const nextAllowedAtRef = useRef(0);

  const canRun = useCallback(() => {
    return Date.now() >= nextAllowedAtRef.current;
  }, []);

  const run = useCallback(async <T>(action: () => Promise<T> | T) => {
    const now = Date.now();
    if (now < nextAllowedAtRef.current) {
      return { blocked: true as const, value: null as T | null };
    }

    nextAllowedAtRef.current = now + waitMs;
    const value = await action();
    return { blocked: false as const, value };
  }, [waitMs]);

  return { canRun, run };
}
