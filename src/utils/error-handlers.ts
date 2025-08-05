/**
 * Centralized error handling utilities
 */

import { logger } from './logger';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  userMessage?: string;
}

/**
 * Creates a standardized error object
 */
export const createError = (
  message: string,
  code?: string,
  statusCode?: number,
  userMessage?: string
): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.userMessage = userMessage || 'An unexpected error occurred';
  return error;
};

/**
 * Standard error handler for async operations
 */
export const handleAsyncError = (
  error: unknown,
  context: string,
  fallbackMessage = 'Operation failed'
): AppError => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`${context}: ${errorMessage}`, error);
  
  if (error instanceof Error) {
    return createError(
      error.message,
      'ASYNC_ERROR',
      500,
      fallbackMessage
    );
  }
  
  return createError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    fallbackMessage
  );
};

/**
 * Supabase error handler
 */
export const handleSupabaseError = (
  error: any,
  context: string,
  fallbackMessage = 'Database operation failed'
): AppError => {
  logger.error(`Supabase ${context}:`, error);
  
  const userMessage = error?.message?.includes('Row Level Security') 
    ? 'You do not have permission to perform this action'
    : fallbackMessage;
    
  return createError(
    error?.message || 'Supabase error',
    error?.code || 'SUPABASE_ERROR',
    error?.status || 500,
    userMessage
  );
};