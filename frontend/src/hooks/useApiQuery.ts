/**
 * useApiQuery Hook
 *
 * Standardized data fetching hook that provides:
 * - Automatic loading state management
 * - Error capture and display
 * - Response validation
 * - Retry capability
 * - Caching (optional)
 *
 * Usage:
 * const { data, isLoading, error, refetch } = useApiQuery(
 *   () => complianceApi.listTensions(),
 *   { onError: (msg) => toast.error(msg) }
 * )
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ApiResponse } from '@/types/compliance'

// ============================================================================
// Types
// ============================================================================

export interface UseApiQueryOptions<T> {
  /** Called when an error occurs */
  onError?: (error: string) => void
  /** Called when data is successfully fetched */
  onSuccess?: (data: T) => void
  /** Whether to fetch immediately on mount (default: true) */
  immediate?: boolean
  /** Dependencies that trigger refetch when changed */
  deps?: unknown[]
  /** Whether to show loading state on refetch (default: true) */
  showLoadingOnRefetch?: boolean
  /** Transform the response data before setting state */
  transform?: (data: T) => T
  /** Retry count on failure (default: 0) */
  retryCount?: number
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number
}

export interface UseApiQueryResult<T> {
  /** The fetched data, or null if not yet loaded */
  data: T | null
  /** Whether the initial fetch is in progress */
  isLoading: boolean
  /** Whether a refetch is in progress */
  isRefetching: boolean
  /** Error message if the fetch failed */
  error: string | null
  /** Function to manually refetch data */
  refetch: () => Promise<void>
  /** Function to manually set data */
  setData: React.Dispatch<React.SetStateAction<T | null>>
  /** Function to clear error state */
  clearError: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useApiQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    onError,
    onSuccess,
    immediate = true,
    deps = [],
    showLoadingOnRefetch = true,
    transform,
    retryCount = 0,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(immediate)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track if this is the initial fetch
  const isInitialFetch = useRef(true)
  // Track current retry attempt
  const retryAttempt = useRef(0)
  // Track if component is mounted
  const isMounted = useRef(true)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchData = useCallback(async (isRefetch = false) => {
    // Set appropriate loading state
    if (isRefetch) {
      if (showLoadingOnRefetch) {
        setIsRefetching(true)
      }
    } else {
      setIsLoading(true)
    }

    try {
      const response = await queryFn()

      // Check if component is still mounted
      if (!isMounted.current) return

      if (response.success && response.data !== undefined) {
        const transformedData = transform ? transform(response.data) : response.data
        setData(transformedData)
        setError(null)
        retryAttempt.current = 0
        onSuccess?.(transformedData)
      } else {
        // API returned success: false
        const errorMessage = response.error?.message || 'Request failed'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      // Check if component is still mounted
      if (!isMounted.current) return

      const errorMessage = err instanceof Error ? err.message : 'Network error'

      // Retry logic
      if (retryAttempt.current < retryCount) {
        retryAttempt.current += 1
        console.warn(`[useApiQuery] Retry attempt ${retryAttempt.current}/${retryCount}`)
        setTimeout(() => {
          if (isMounted.current) {
            fetchData(isRefetch)
          }
        }, retryDelay)
        return
      }

      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsRefetching(false)
        isInitialFetch.current = false
      }
    }
  }, [queryFn, onError, onSuccess, showLoadingOnRefetch, transform, retryCount, retryDelay])

  const refetch = useCallback(async () => {
    retryAttempt.current = 0
    await fetchData(true)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetchData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate])

  // Refetch when dependencies change
  useEffect(() => {
    if (!isInitialFetch.current && deps.length > 0) {
      fetchData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    setData,
    clearError,
  }
}

// ============================================================================
// useApiMutation Hook (for POST/PUT/DELETE operations)
// ============================================================================

export interface UseApiMutationOptions<TData, TVariables> {
  /** Called when mutation succeeds */
  onSuccess?: (data: TData, variables: TVariables) => void
  /** Called when mutation fails */
  onError?: (error: string, variables: TVariables) => void
  /** Called before mutation starts */
  onMutate?: (variables: TVariables) => void
}

export interface UseApiMutationResult<TData, TVariables> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<TData | null>
  /** Execute the mutation and throw on error */
  mutateAsync: (variables: TVariables) => Promise<TData>
  /** Whether mutation is in progress */
  isLoading: boolean
  /** Error message if mutation failed */
  error: string | null
  /** Reset mutation state */
  reset: () => void
}

export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> {
  const { onSuccess, onError, onMutate } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
    setIsLoading(false)
  }, [])

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    setIsLoading(true)
    setError(null)
    onMutate?.(variables)

    try {
      const response = await mutationFn(variables)

      if (response.success && response.data !== undefined) {
        onSuccess?.(response.data, variables)
        return response.data
      } else {
        const errorMessage = response.error?.message || 'Operation failed'
        setError(errorMessage)
        onError?.(errorMessage, variables)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      onError?.(errorMessage, variables)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [mutationFn, onSuccess, onError, onMutate])

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    const result = await mutate(variables)
    if (result === null) {
      throw new Error(error || 'Mutation failed')
    }
    return result
  }, [mutate, error])

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    reset,
  }
}

export default useApiQuery