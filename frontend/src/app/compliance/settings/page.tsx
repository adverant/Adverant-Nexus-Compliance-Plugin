/**
 * Compliance Plugin Settings Page
 */

'use client'

import { Settings, Save } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme()
  const tc = useThemeClasses()

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Plugin configuration"
        icon={<Settings className={cn('h-6 w-6', tc.accentCyan)} />}
      />

      <div className={cn('rounded-xl border p-6', tc.card)}>
        <h3 className={cn('text-lg font-semibold mb-4', tc.textPrimary)}>Appearance</h3>

        <div className="flex items-center justify-between py-4 border-b border-inherit">
          <div>
            <p className={cn('font-medium', tc.textPrimary)}>Dark Mode</p>
            <p className={cn('text-sm', tc.textMuted)}>Use dark theme for the compliance plugin</p>
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              isDark ? 'bg-coinest-accent-cyan' : 'bg-neutral-300'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                isDark ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <div className="py-4">
          <p className={cn('font-medium', tc.textPrimary)}>API Configuration</p>
          <p className={cn('text-sm mb-3', tc.textMuted)}>Configure the compliance API endpoint</p>
          <input
            type="text"
            placeholder="https://api.example.com"
            defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}
            className={cn('w-full max-w-md px-4 py-2 rounded-lg border', tc.input)}
          />
        </div>

        <div className="pt-4">
          <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>

      <div className={cn('rounded-xl border p-6', tc.card)}>
        <h3 className={cn('text-lg font-semibold mb-4', tc.textPrimary)}>Plugin Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-inherit">
            <span className={tc.textMuted}>Version</span>
            <span className={cn('font-mono', tc.textPrimary)}>1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-inherit">
            <span className={tc.textMuted}>Frameworks</span>
            <span className={cn('font-mono', tc.textPrimary)}>6</span>
          </div>
          <div className="flex justify-between py-2 border-b border-inherit">
            <span className={tc.textMuted}>Total Controls</span>
            <span className={cn('font-mono', tc.textPrimary)}>688</span>
          </div>
          <div className="flex justify-between py-2">
            <span className={tc.textMuted}>License</span>
            <span className={cn('font-mono', tc.textPrimary)}>Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  )
}
