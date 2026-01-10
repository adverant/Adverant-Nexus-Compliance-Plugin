/**
 * Compliance Plugin Sidebar
 *
 * Navigation sidebar for the compliance plugin with theme toggle.
 * Supports both light and dark modes.
 *
 * Uses mounted state to prevent hydration mismatches between SSR and client.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListChecks,
  GitCompare,
  Brain,
  Scale,
  FileSearch,
  Radio,
  Settings,
  ChevronRight,
  Moon,
  Sun,
  ShieldCheck,
  ClipboardCheck,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  divider?: boolean
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/compliance',
    icon: LayoutDashboard,
    description: 'Overview of compliance posture',
  },
  {
    name: 'Assessments',
    href: '/compliance/assessments',
    icon: ClipboardCheck,
    description: 'Run and manage assessments',
  },
  {
    name: 'Control Library',
    href: '/compliance/controls',
    icon: ListChecks,
    description: '688+ controls across 6 frameworks',
  },
  {
    name: 'Reports',
    href: '/compliance/reports',
    icon: FileText,
    description: 'Generate compliance reports',
    divider: true,
  },
  {
    name: 'Cross-Framework',
    href: '/compliance/cross-framework',
    icon: GitCompare,
    description: 'Compare and analyze control mappings',
  },
  {
    name: 'Trustworthiness',
    href: '/compliance/trustworthiness',
    icon: Brain,
    description: 'AI assessment based on 7 EU requirements',
  },
  {
    name: 'Ethical Tensions',
    href: '/compliance/tensions',
    icon: Scale,
    description: 'Value conflicts and trade-offs',
  },
  {
    name: 'Z-Inspection',
    href: '/compliance/z-inspection',
    icon: FileSearch,
    description: 'Import and track Z-Inspection reports',
    divider: true,
  },
  {
    name: 'Regulatory Monitor',
    href: '/compliance/regulatory',
    icon: Radio,
    description: 'Track regulatory changes',
  },
  {
    name: 'Settings',
    href: '/compliance/settings',
    icon: Settings,
    description: 'Plugin configuration',
  },
]

export function Sidebar() {
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  const rawPathname = usePathname()
  const pathname = rawPathname || '/compliance'
  const { isDark, toggleTheme } = useTheme()
  const tc = useThemeClasses()

  // Set mounted after first render to ensure client-only rendering for dynamic parts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to determine if a nav item is active
  const getIsActive = (itemHref: string): boolean => {
    if (!mounted) return itemHref === '/compliance' // Default during SSR
    if (itemHref === '/compliance') {
      return pathname === '/compliance'
    }
    return pathname === itemHref || pathname.startsWith(itemHref + '/')
  }

  return (
    <aside className="w-64 h-screen border-r flex flex-col shrink-0 bg-coinest-bg-secondary border-coinest-border">
      {/* Plugin Header */}
      <div className="h-16 flex items-center px-6 border-b shrink-0 border-coinest-border">
        <ShieldCheck className="h-8 w-8 text-coinest-accent-cyan" />
        <div className="ml-3">
          <h1 className="text-lg font-bold text-white">Compliance</h1>
          <p className="text-xs text-coinest-text-muted">Enterprise Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        {navigation.map((item, index) => {
          const isActive = getIsActive(item.href)

          return (
            <div key={item.name}>
              {item.divider && index > 0 && (
                <div className="my-3 border-t border-coinest-border" />
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-coinest-accent-cyan text-white'
                    : 'text-coinest-text-muted hover:bg-coinest-bg-tertiary'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.name}</div>
                  <div
                    className={cn(
                      'text-xs truncate',
                      isActive ? 'text-white/70' : 'text-coinest-text-muted'
                    )}
                  >
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    isActive ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'
                  )}
                />
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer with Theme Toggle and Info */}
      <div className="p-4 border-t shrink-0 border-coinest-border">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-4 transition-colors bg-coinest-bg-tertiary hover:bg-coinest-bg-primary text-coinest-text-secondary"
        >
          <span className="text-sm font-medium">
            {mounted ? (isDark ? 'Dark Mode' : 'Light Mode') : 'Dark Mode'}
          </span>
          {mounted && isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>

        {/* Plugin Info */}
        <div className="text-xs text-coinest-text-muted">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Frameworks</span>
            <span className="font-mono">6</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Controls</span>
            <span className="font-mono">688+</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
