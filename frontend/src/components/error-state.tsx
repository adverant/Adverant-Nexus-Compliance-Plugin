/**
 * Error State Component
 *
 * Standardized error display component for consistent error UI across all pages.
 * Use this for API errors, validation errors, and empty states.
 */

import { AlertTriangle, RefreshCw, AlertCircle, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeClasses } from '@/hooks/useThemeClasses'

// ============================================================================
// Types
// ============================================================================

export interface ErrorStateProps {
  /** Error message to display */
  message: string
  /** Error title (optional, defaults based on variant) */
  title?: string
  /** Error variant for different styling */
  variant?: 'error' | 'warning' | 'empty' | 'notFound'
  /** Callback when retry button is clicked */
  onRetry?: () => void
  /** Whether retry is in progress */
  isRetrying?: boolean
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

// ============================================================================
// Component
// ============================================================================

export function ErrorState({
  message,
  title,
  variant = 'error',
  onRetry,
  isRetrying = false,
  className,
  size = 'md',
}: ErrorStateProps) {
  const tc = useThemeClasses()

  // Get icon based on variant
  const Icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    empty: FileWarning,
    notFound: FileWarning,
  }[variant]

  // Get default title based on variant
  const defaultTitle = {
    error: 'Something went wrong',
    warning: 'Warning',
    empty: 'No data found',
    notFound: 'Not found',
  }[variant]

  // Get icon color based on variant
  const iconColor = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    empty: 'text-gray-400',
    notFound: 'text-gray-400',
  }[variant]

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'h-8 w-8',
      title: 'text-sm font-medium',
      message: 'text-xs',
      button: 'text-xs px-3 py-1.5',
    },
    md: {
      container: 'p-8',
      icon: 'h-12 w-12',
      title: 'text-base font-medium',
      message: 'text-sm',
      button: 'text-sm px-4 py-2',
    },
    lg: {
      container: 'p-12',
      icon: 'h-16 w-16',
      title: 'text-lg font-semibold',
      message: 'text-base',
      button: 'px-5 py-2.5',
    },
  }[size]

  return (
    <div
      className={cn(
        'rounded-lg text-center flex flex-col items-center justify-center',
        tc.card,
        'border',
        sizeClasses.container,
        className
      )}
    >
      <Icon className={cn(sizeClasses.icon, iconColor, 'mx-auto mb-4')} />

      <h3 className={cn(sizeClasses.title, tc.textPrimary, 'mb-2')}>
        {title || defaultTitle}
      </h3>

      <p className={cn(sizeClasses.message, tc.textMuted, 'mb-4 max-w-md')}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            'inline-flex items-center gap-2 rounded-md transition-colors',
            tc.buttonSecondary,
            sizeClasses.button,
            isRetrying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Inline error message (smaller, for form fields or inline sections)
 */
export function InlineError({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  const tc = useThemeClasses()

  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-500', className)}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Empty state with custom icon and action
 */
export function EmptyState({
  title,
  message,
  icon: CustomIcon,
  action,
  className,
}: {
  title: string
  message: string
  icon?: React.ElementType
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}) {
  const tc = useThemeClasses()
  const Icon = CustomIcon || FileWarning

  return (
    <div
      className={cn(
        'rounded-lg p-8 text-center flex flex-col items-center justify-center',
        tc.card,
        'border',
        className
      )}
    >
      <Icon className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />

      <h3 className={cn('text-base font-medium mb-2', tc.textPrimary)}>
        {title}
      </h3>

      <p className={cn('text-sm mb-4 max-w-md', tc.textMuted)}>
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors',
            tc.buttonPrimary
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * Loading state placeholder (use with ErrorState for consistent loading/error/data states)
 */
export function LoadingState({
  message = 'Loading...',
  className,
}: {
  message?: string
  className?: string
}) {
  const tc = useThemeClasses()

  return (
    <div
      className={cn(
        'rounded-lg p-8 text-center flex flex-col items-center justify-center',
        tc.card,
        'border',
        className
      )}
    >
      <RefreshCw className={cn('h-12 w-12 mx-auto mb-4 animate-spin', tc.textMuted)} />
      <p className={cn('text-sm', tc.textMuted)}>{message}</p>
    </div>
  )
}

export default ErrorState