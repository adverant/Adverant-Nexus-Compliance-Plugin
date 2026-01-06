/**
 * Page Header Component
 *
 * Consistent page header with title, description, and optional actions.
 * Supports light/dark themes.
 */

'use client'

import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  const tc = useThemeClasses()

  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            tc.bgTertiary
          )}>
            {icon}
          </div>
        )}
        <div>
          <h1 className={cn('text-2xl md:text-3xl font-bold font-urbanist', tc.textPrimary)}>
            {title}
          </h1>
          {description && (
            <p className={cn('mt-1', tc.textMuted)}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
