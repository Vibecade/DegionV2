import { useState, useCallback } from 'react';

export interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error?: string;
}

export function useOptimisticUpdates<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false
  });

  const updateOptimistically = useCallback(
    async (optimisticData: T) => {
      // Immediately update UI with optimistic data
      setState({
        data: optimisticData,
        isOptimistic: true,
        error: undefined
      });

      try {
        // Perform actual server update
        const serverData = await updateFn(optimisticData);
        
        // Update with confirmed server data
        setState({
          data: serverData,
          isOptimistic: false,
          error: undefined
        });

        return serverData;
      } catch (error) {
        // Revert to previous state on error
        setState({
          data: initialData,
          isOptimistic: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
        
        throw error;
      }
    },
    [initialData, updateFn]
  );

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return {
    ...state,
    updateOptimistically,
    resetError
  };
}