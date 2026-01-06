/**
 * ChartCard - Theme-aware chart wrapper
 *
 * Card for containing charts with consistent header
 * and optional actions. Supports light/dark themes.
 */

'use client'

import { useTheme } from '@/stores/theme-store'

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: ChartCardProps) {
  const { isDark } = useTheme()

  const cardBg = isDark ? 'bg-coinest-bg-secondary' : 'bg-white'
  const borderColor = isDark ? 'border-coinest-border' : 'border-neutral-200'
  const titleColor = isDark ? 'text-white' : 'text-neutral-900'
  const subtitleColor = isDark ? 'text-coinest-text-muted' : 'text-neutral-500'

  return (
    <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
        <div>
          <h3 className={`text-lg font-semibold ${titleColor} font-urbanist`}>{title}</h3>
          {subtitle && (
            <p className={`${subtitleColor} text-sm mt-0.5`}>{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Chart content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

// Time range selector component for charts
interface TimeRange {
  value: string
  label: string
}

interface TimeRangeSelectorProps {
  ranges: TimeRange[] | string[]
  selected: string
  onChange: (range: string) => void
}

export function TimeRangeSelector({ ranges, selected, onChange }: TimeRangeSelectorProps) {
  const { isDark } = useTheme()

  // Normalize ranges to always have value/label structure
  const normalizedRanges: TimeRange[] = ranges.map((range) => {
    if (typeof range === 'string') {
      return { value: range, label: range }
    }
    return range
  })

  const bgColor = isDark ? 'bg-coinest-bg-tertiary' : 'bg-neutral-100'
  const activeClasses = 'bg-coinest-accent-cyan text-white'
  const inactiveClasses = isDark
    ? 'text-coinest-text-muted hover:text-white'
    : 'text-neutral-600 hover:text-neutral-900'

  return (
    <div className={`flex items-center gap-1 ${bgColor} rounded-lg p-1`}>
      {normalizedRanges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selected === range.value ? activeClasses : inactiveClasses
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
