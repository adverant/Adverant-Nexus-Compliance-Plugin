/**
 * Compliance Plugin Sidebar
 *
 * Navigation sidebar for the compliance plugin with theme toggle.
 * Supports both light and dark modes.
 */

'use client'

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
    name: 'Control Library',
    href: '/compliance/controls',
    icon: ListChecks,
    description: '688+ controls across 6 frameworks',
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
    divider: true,
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
  },
  {
    name: 'Regulatory Monitor',
    href: '/compliance/regulatory',
    icon: Radio,
    description: 'Track regulatory changes',
    divider: true,
  },
  {
    name: 'Settings',
    href: '/compliance/settings',
    icon: Settings,
    description: 'Plugin configuration',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isDark, toggleTheme } = useTheme()
  const tc = useThemeClasses()

  return (
    <aside className={cn('w-64 border-r flex flex-col', tc.sidebarBg, tc.border)}>
      {/* Plugin Header */}
      <div className={cn('h-16 flex items-center px-6 border-b', tc.border)}>
        <ShieldCheck className={cn('h-8 w-8', tc.accentCyan)} />
        <div className="ml-3">
          <h1 className={cn('text-lg font-bold', tc.textPrimary)}>Compliance</h1>
          <p className={cn('text-xs', tc.textMuted)}>Enterprise Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/compliance' && pathname.startsWith(item.href))

          return (
            <div key={item.name}>
              {item.divider && index > 0 && (
                <div className={cn('my-3 border-t', tc.border)} />
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors group',
                  isActive
                    ? tc.sidebarActive
                    : cn(tc.textMuted, tc.sidebarHover)
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.name}</div>
                  <div
                    className={cn(
                      'text-xs truncate',
                      isActive ? 'text-white/70' : tc.textMuted
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
      <div className={cn('p-4 border-t', tc.border)}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-4 transition-colors',
            tc.buttonSecondary
          )}
        >
          <span className={cn('text-sm font-medium', tc.textSecondary)}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          {isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>

        {/* Plugin Info */}
        <div className={cn('text-xs', tc.textMuted)}>
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
