/**
 * Custom hook for handling async operations with consistent loading, error, and success states
 */

import { useState, useCallback } from 'react';
import { handleAsyncError, AppError } from '@/utils/error-handlers';
import { useToast } from './use-toast';

interface AsyncOperationState {
  isLoading: boolean;
  error: AppError | null;
}

interface UseAsyncOperationOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: UseAsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null
  });
  
  const { toast } = useToast();
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed'
  } = options;

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setState({ isLoading: true, error: null });
    
    try {
      const result = await operation(...args);
      
      setState({ isLoading: false, error: null });
      
      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: successMessage
        });
      }
      
      return result;
    } catch (error) {
      const appError = handleAsyncError(error, 'AsyncOperation', errorMessage);
      setState({ isLoading: false, error: appError });
      
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: appError.userMessage,
          variant: 'destructive'
        });
      }
      
      return null;
    }
  }, [operation, showSuccessToast, showErrorToast, successMessage, errorMessage, toast]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};