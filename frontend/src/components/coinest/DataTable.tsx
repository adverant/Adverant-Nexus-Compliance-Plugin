/**
 * DataTable - Theme-aware sortable data table
 *
 * Sortable table with hover states and optional
 * row click handler. Supports light/dark themes.
 *
 * Features:
 * - Sortable columns
 * - Custom cell renderers
 * - Proper row keys (uses id field or generates stable key)
 * - Theme-aware styling
 */

'use client'

import { useState, useMemo } from 'react'
import { useTheme } from '@/stores/theme-store'

// ============================================================================
// Types
// ============================================================================

interface Column<T extends Record<string, unknown>> {
  /** The key to access the value from the row object */
  key: string
  /** The header text to display */
  header: string
  /** Custom renderer for the cell value */
  render?: (value: unknown, row: T) => React.ReactNode
  /** Whether this column is sortable */
  sortable?: boolean
  /** Optional fixed width for the column */
  width?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  /** Column definitions */
  columns: Column<T>[]
  /** Data rows to display */
  data: T[]
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void
  /** Message to display when data is empty */
  emptyMessage?: string
  /** Custom function to generate row keys (defaults to using 'id' field) */
  getRowKey?: (row: T, index: number) => string | number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a stable key for a row.
 * Prefers 'id' field, falls back to stringified row content with index.
 */
function defaultGetRowKey<T extends Record<string, unknown>>(row: T, index: number): string {
  // Try common ID field names
  if (row.id !== undefined && row.id !== null) {
    return String(row.id)
  }
  if (row._id !== undefined && row._id !== null) {
    return String(row._id)
  }
  if (row.uuid !== undefined && row.uuid !== null) {
    return String(row.uuid)
  }

  // Fall back to a composite key using unique fields
  // This is better than just using index since it remains stable across re-renders
  // as long as the row content doesn't change
  const uniqueFields = ['controlNumber', 'title', 'name', 'key']
  for (const field of uniqueFields) {
    if (row[field] !== undefined && row[field] !== null) {
      return `${field}-${String(row[field])}-${index}`
    }
  }

  // Last resort: use index (not ideal but prevents crashes)
  return `row-${index}`
}

/**
 * Safely get a value from a row using a string key path
 */
function getRowValue<T extends Record<string, unknown>>(row: T, key: string): unknown {
  return row[key]
}

// ============================================================================
// Component
// ============================================================================

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  getRowKey = defaultGetRowKey,
}: DataTableProps<T>) {
  const { isDark } = useTheme()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aVal = getRowValue(a, sortKey)
      const bVal = getRowValue(b, sortKey)

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      // Handle different types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal)
        return sortDirection === 'asc' ? comparison : -comparison
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        const comparison = aVal - bVal
        return sortDirection === 'asc' ? comparison : -comparison
      }

      // Default comparison
      const comparison = String(aVal) < String(bVal) ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  // Theme-aware colors
  const cardBg = isDark ? 'bg-coinest-bg-secondary' : 'bg-white'
  const borderColor = isDark ? 'border-coinest-border' : 'border-neutral-200'
  const headerBg = isDark ? 'bg-coinest-bg-tertiary' : 'bg-neutral-50'
  const headerText = isDark ? 'text-coinest-text-muted' : 'text-neutral-500'
  const headerHover = isDark ? 'hover:text-white' : 'hover:text-neutral-900'
  const cellText = isDark ? 'text-coinest-text-primary' : 'text-neutral-700'
  const rowHover = isDark ? 'hover:bg-coinest-bg-tertiary' : 'hover:bg-neutral-50'
  const divideColor = isDark ? 'divide-coinest-border' : 'divide-neutral-200'
  const emptyText = isDark ? 'text-coinest-text-muted' : 'text-neutral-500'

  return (
    <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={headerBg}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-xs font-semibold ${headerText} uppercase tracking-wider ${
                    col.sortable ? `cursor-pointer ${headerHover} select-none` : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <svg
                        className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${divideColor}`}>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-6 py-12 text-center ${emptyText}`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick ? `${rowHover} cursor-pointer` : ''
                  }`}
                >
                  {columns.map((col) => {
                    const value = getRowValue(row, col.key)
                    return (
                      <td
                        key={col.key}
                        className={`px-6 py-4 text-sm ${cellText}`}
                      >
                        {col.render
                          ? col.render(value, row)
                          : String(value ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable