"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { ActionState, FieldErrors } from "@/lib/create-safe-action";

type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

type useActionOptions<TOutput> = {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  timeoutMs?: number;
  timeoutMessage?: string;
  skipRefresh?: boolean;
};

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: useActionOptions<TOutput> = {}
) => {
  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);

  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);

      try {
        const result = options.timeoutMs
          ? await Promise.race([
              action(input),
              new Promise<ActionState<TInput, TOutput>>((resolve) =>
                setTimeout(
                  () => resolve({ error: options.timeoutMessage ?? "Request timed out. Please try again." }),
                  options.timeoutMs
                )
              ),
            ])
          : await action(input);

        if (!result) return;

        setFieldErrors(result.fieldErrors);

        if (result.error) {
          setError(result.error);
          options.onError?.(result.error);
        }

        if (result.data) {
          setData(result.data);
          if (!options.skipRefresh) {
            router.refresh();
          }
          options.onSuccess?.(result.data);
        }
      } finally {
        setIsLoading(false);
        options.onComplete?.();
      }
    },
    [action, options, router]
  );

  return {
    execute,
    fieldErrors,
    error,
    data,
    isLoading,
  };
};
