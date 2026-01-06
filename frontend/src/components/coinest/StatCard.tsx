/**
 * StatCard - Coinest-styled metric display card
 *
 * Theme-aware card for dashboard statistics with
 * optional change indicator, icon, and variants.
 */

'use client'

import Link from 'next/link'
import { useTheme } from '@/stores/theme-store'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type?: 'increase' | 'decrease'
    isPositive?: boolean
  }
  icon?: React.ReactNode
  subtitle?: string
  href?: string
  variant?: 'default' | 'cyan' | 'success' | 'warning' | 'danger'
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon,
  subtitle,
  href,
  variant = 'default',
  className = '',
}: StatCardProps) {
  const { isDark } = useTheme()

  const variantStyles = {
    default: {
      icon: isDark ? 'text-coinest-accent-brown bg-coinest-accent-brown/20' : 'text-neutral-600 bg-neutral-100',
      accent: isDark ? 'text-coinest-accent-brown' : 'text-neutral-600',
    },
    cyan: {
      icon: isDark ? 'text-coinest-accent-cyan bg-coinest-accent-cyan/20' : 'text-brand-500 bg-brand-100',
      accent: isDark ? 'text-coinest-accent-cyan' : 'text-brand-500',
    },
    success: {
      icon: isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100',
      accent: isDark ? 'text-green-400' : 'text-green-600',
    },
    warning: {
      icon: isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-100',
      accent: isDark ? 'text-yellow-400' : 'text-yellow-600',
    },
    danger: {
      icon: isDark ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100',
      accent: isDark ? 'text-red-400' : 'text-red-600',
    },
  }

  const styles = variantStyles[variant]

  const cardBg = isDark ? 'bg-coinest-bg-secondary' : 'bg-white'
  const cardBorder = isDark ? 'border-coinest-border hover:border-coinest-border/80' : 'border-neutral-200 hover:border-neutral-300'
  const titleColor = isDark ? 'text-coinest-text-muted' : 'text-neutral-500'
  const valueColor = isDark ? 'text-white' : 'text-neutral-900'
  const subtitleColor = isDark ? 'text-coinest-text-muted' : 'text-neutral-500'
  const borderColor = isDark ? 'border-coinest-border' : 'border-neutral-200'

  const content = (
    <div className={`${cardBg} rounded-xl p-6 border ${cardBorder} transition-all ${href ? 'cursor-pointer' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`${titleColor} text-sm font-medium`}>{title}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.icon}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${valueColor} mb-2 font-urbanist`}>{value}</div>
      {change && (
        <div className={`text-sm flex items-center gap-1 ${
          change.isPositive || change.type === 'increase'
            ? isDark ? 'text-green-400' : 'text-green-600'
            : isDark ? 'text-red-400' : 'text-red-600'
        }`}>
          {change.isPositive || change.type === 'increase' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {Math.abs(change.value)}%
        </div>
      )}
      {subtitle && !change && (
        <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>
      )}
      {href && (
        <div className={`mt-4 pt-4 border-t ${borderColor} text-sm font-medium ${styles.accent} inline-flex items-center gap-1 group`}>
          View details
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// Grid wrapper for stat cards
interface StatGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  )
}
