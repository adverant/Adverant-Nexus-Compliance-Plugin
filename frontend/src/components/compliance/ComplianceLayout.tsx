/**
 * Compliance Layout Component
 *
 * Main layout wrapper for compliance plugin pages.
 * Includes sidebar navigation and content area.
 */

'use client'

import { Sidebar } from './Sidebar'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

interface ComplianceLayoutProps {
  children: React.ReactNode
}

export function ComplianceLayout({ children }: ComplianceLayoutProps) {
  const tc = useThemeClasses()

  return (
    <div className={cn('flex h-screen', tc.pageWrapper)}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
