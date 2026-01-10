/**
 * Toast Notification System
 *
 * Provides a context-based toast notification system with:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss
 * - Stacking support
 * - Animation support
 *
 * Usage:
 * 1. Wrap your app with <ToastProvider>
 * 2. Use the useToast() hook to show toasts:
 *    const { toast } = useToast()
 *    toast.success('Operation completed!')
 *    toast.error('Something went wrong')
 */

'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  toast: {
    success: (title: string, message?: string) => string
    error: (title: string, message?: string) => string
    warning: (title: string, message?: string) => string
    info: (title: string, message?: string) => string
  }
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: ReactNode
  /** Default duration in milliseconds (default: 5000) */
  defaultDuration?: number
  /** Maximum number of toasts to show at once (default: 5) */
  maxToasts?: number
  /** Position of toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
  position = 'top-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    setToasts((prev) => {
      const newToasts = [{ ...toast, id }, ...prev]
      // Limit number of toasts
      return newToasts.slice(0, maxToasts)
    })

    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Convenience methods
  const toast = {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message, duration: defaultDuration, dismissible: true }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: defaultDuration * 1.5, dismissible: true }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message, duration: defaultDuration, dismissible: true }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message, duration: defaultDuration, dismissible: true }),
  }

  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}

      {/* Toast Container */}
      <div
        className={cn(
          'fixed z-[100] flex flex-col gap-2 pointer-events-none',
          positionClasses[position]
        )}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ============================================================================
// Toast Item Component
// ============================================================================

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(onDismiss, 200) // Wait for exit animation
  }, [onDismiss])

  // Enter animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast.duration, handleDismiss])

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
  }

  const borderColors: Record<ToastType, string> = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
  }

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto w-80 max-w-full',
        'bg-coinest-bg-secondary border border-coinest-border rounded-lg shadow-lg',
        'border-l-4',
        borderColors[toast.type],
        'transform transition-all duration-200 ease-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-sm text-coinest-text-muted mt-1">
              {toast.message}
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        {toast.dismissible !== false && (
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded hover:bg-coinest-bg-tertiary text-coinest-text-muted hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress Bar (for auto-dismiss) */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-coinest-bg-tertiary rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all ease-linear',
              toast.type === 'success' && 'bg-green-500',
              toast.type === 'error' && 'bg-red-500',
              toast.type === 'warning' && 'bg-yellow-500',
              toast.type === 'info' && 'bg-blue-500'
            )}
            style={{
              width: '100%',
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

// ============================================================================
// Standalone Toast Function (for use outside React components)
// ============================================================================

// Store for standalone usage
let toastStore: ToastContextValue | null = null

export function setToastStore(store: ToastContextValue) {
  toastStore = store
}

export const standaloneToast = {
  success: (title: string, message?: string) => {
    if (!toastStore) {
      console.warn('Toast store not initialized. Make sure ToastProvider is mounted.')
      return
    }
    return toastStore.toast.success(title, message)
  },
  error: (title: string, message?: string) => {
    if (!toastStore) {
      console.warn('Toast store not initialized. Make sure ToastProvider is mounted.')
      return
    }
    return toastStore.toast.error(title, message)
  },
  warning: (title: string, message?: string) => {
    if (!toastStore) {
      console.warn('Toast store not initialized. Make sure ToastProvider is mounted.')
      return
    }
    return toastStore.toast.warning(title, message)
  },
  info: (title: string, message?: string) => {
    if (!toastStore) {
      console.warn('Toast store not initialized. Make sure ToastProvider is mounted.')
      return
    }
    return toastStore.toast.info(title, message)
  },
}

export default ToastProvider