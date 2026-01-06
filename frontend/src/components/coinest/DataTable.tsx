/**
 * DataTable - Theme-aware sortable data table
 *
 * Sortable table with hover states and optional
 * row click handler. Supports light/dark themes.
 */

'use client'

import { useState } from 'react'
import { useTheme } from '@/stores/theme-store'

interface Column<T> {
  key: keyof T
  header: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const { isDark } = useTheme()
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    const comparison = aVal < bVal ? -1 : 1
    return sortDirection === 'asc' ? comparison : -comparison
  })

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
                  key={String(col.key)}
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
              sortedData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick ? `${rowHover} cursor-pointer` : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 text-sm ${cellText}`}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
