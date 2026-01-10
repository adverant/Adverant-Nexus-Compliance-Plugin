/**
 * Skeleton Loading Components
 *
 * Provides animated placeholder components for loading states.
 * Use these instead of spinners for better perceived performance.
 *
 * Components:
 * - Skeleton: Base skeleton block
 * - TableSkeleton: Table rows placeholder
 * - CardSkeleton: Card placeholder
 * - ChartSkeleton: Chart area placeholder
 * - StatCardSkeleton: Stat card placeholder
 * - PageSkeleton: Full page loading placeholder
 */

'use client'

import { cn } from '@/lib/utils'
import { useThemeClasses } from '@/hooks/useThemeClasses'

// ============================================================================
// Base Skeleton Component
// ============================================================================

interface SkeletonProps {
  className?: string
  /** Width of the skeleton (CSS value) */
  width?: string
  /** Height of the skeleton (CSS value) */
  height?: string
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  const tc = useThemeClasses()

  return (
    <div
      className={cn(
        'animate-pulse rounded',
        tc.bgTertiary,
        className
      )}
      style={{ width, height }}
    />
  )
}

// ============================================================================
// Table Skeleton
// ============================================================================

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number
  /** Number of columns to display */
  columns?: number
  /** Whether to show header row */
  showHeader?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  const tc = useThemeClasses()

  return (
    <div className={cn('rounded-xl border overflow-hidden', tc.card)}>
      {/* Header */}
      {showHeader && (
        <div className={cn('flex gap-4 p-4', tc.tableHeader)}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className={cn('divide-y', tc.tableDivider)}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 flex-1"
                // Vary widths for more natural look
                width={colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Card Skeleton
// ============================================================================

interface CardSkeletonProps {
  /** Whether to show badge placeholder */
  showBadge?: boolean
  /** Whether to show description lines */
  showDescription?: boolean
  /** Number of description lines */
  descriptionLines?: number
}

export function CardSkeleton({
  showBadge = true,
  showDescription = true,
  descriptionLines = 2,
}: CardSkeletonProps) {
  const tc = useThemeClasses()

  return (
    <div className={cn('rounded-xl border p-4', tc.card)}>
      {/* Header with badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full ml-2" />
      </div>

      {/* Description */}
      {showDescription && (
        <div className="space-y-2 mb-3">
          {Array.from({ length: descriptionLines }).map((_, i) => (
            <Skeleton
              key={`desc-${i}`}
              className="h-3"
              width={i === descriptionLines - 1 ? '60%' : '100%'}
            />
          ))}
        </div>
      )}

      {/* Footer badges */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

// ============================================================================
// Chart Skeleton
// ============================================================================

interface ChartSkeletonProps {
  /** Type of chart to simulate */
  type?: 'bar' | 'line' | 'pie' | 'radar'
  /** Height of the chart area */
  height?: string
}

export function ChartSkeleton({
  type = 'bar',
  height = '300px',
}: ChartSkeletonProps) {
  const tc = useThemeClasses()

  if (type === 'pie') {
    return (
      <div className={cn('rounded-xl border p-4', tc.card)} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <Skeleton className="rounded-full" width="200px" height="200px" />
        </div>
      </div>
    )
  }

  if (type === 'radar') {
    return (
      <div className={cn('rounded-xl border p-4', tc.card)} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <Skeleton className="rounded-full" width="220px" height="220px" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="rounded-full opacity-50" width="150px" height="150px" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Bar or Line chart
  return (
    <div className={cn('rounded-xl border p-4', tc.card)} style={{ height }}>
      {/* Y-axis labels */}
      <div className="flex h-full">
        <div className="flex flex-col justify-between py-2 pr-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`y-${i}`} className="h-3 w-8" />
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 flex items-end gap-2 pb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`bar-${i}`} className="flex-1 flex flex-col justify-end h-full">
              <Skeleton
                className="w-full rounded-t"
                height={`${30 + Math.random() * 50}%`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2 pl-10 mt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`x-${i}`} className="h-3 flex-1" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Stat Card Skeleton
// ============================================================================

export function StatCardSkeleton() {
  const tc = useThemeClasses()

  return (
    <div className={cn('rounded-xl border p-4', tc.card)}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// ============================================================================
// Page Skeleton
// ============================================================================

interface PageSkeletonProps {
  /** Type of page layout */
  layout?: 'table' | 'grid' | 'dashboard'
  /** Number of items to show */
  items?: number
}

export function PageSkeleton({
  layout = 'table',
  items = 6,
}: PageSkeletonProps) {
  const tc = useThemeClasses()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats row for dashboard */}
      {layout === 'dashboard' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={`stat-${i}`} />
          ))}
        </div>
      )}

      {/* Filters */}
      <div className={cn('rounded-xl border p-4', tc.card)}>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      {layout === 'table' && <TableSkeleton rows={items} columns={5} />}

      {layout === 'grid' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: items }).map((_, i) => (
            <CardSkeleton key={`card-${i}`} />
          ))}
        </div>
      )}

      {layout === 'dashboard' && (
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton type="bar" height="350px" />
          <ChartSkeleton type="pie" height="350px" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Export All
// ============================================================================

/** Named export containing all skeleton components */
export const SkeletonComponents = {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ChartSkeleton,
  StatCardSkeleton,
  PageSkeleton,
}

/** Default export is the base Skeleton component */
export default Skeleton