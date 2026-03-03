"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseAsyncOptions<T> = {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
};

type UseAsyncReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  clearError: () => void;
  reset: () => void;
};

export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options?: UseAsyncOptions<T>,
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asyncFnRef = useRef(asyncFn);
  const optionsRef = useRef(options);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setError(null);
    setLoading(true);

    try {
      const result = await asyncFnRef.current(...args);
      setData(result);
      optionsRef.current?.onSuccess?.(result);
      return result;
    } catch (error_) {
      const message =
        error_ instanceof Error ? error_.message : "An unexpected error occurred";
      setError(message);
      optionsRef.current?.onError?.(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (options?.immediate) {
      void execute();
    }
  }, []);

  return { data, loading, error, execute, clearError, reset };
}
