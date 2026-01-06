/**
 * Theme Classes Hook
 *
 * Provides consistent theme-aware CSS class strings for compliance plugin components.
 * Follows the Coinest dark theme + light theme counterparts.
 */

import { useTheme } from '@/stores/theme-store'

export function useThemeClasses() {
  const { isDark } = useTheme()

  return {
    // Background colors
    bgPrimary: isDark ? 'bg-coinest-bg-primary' : 'bg-neutral-50',
    bgSecondary: isDark ? 'bg-coinest-bg-secondary' : 'bg-white',
    bgTertiary: isDark ? 'bg-coinest-bg-tertiary' : 'bg-neutral-100',

    // Text colors
    textPrimary: isDark ? 'text-white' : 'text-neutral-900',
    textSecondary: isDark ? 'text-coinest-text-secondary' : 'text-neutral-700',
    textMuted: isDark ? 'text-coinest-text-muted' : 'text-neutral-500',

    // Border colors
    border: isDark ? 'border-coinest-border' : 'border-neutral-200',

    // Accent colors
    accentCyan: isDark ? 'text-coinest-accent-cyan' : 'text-brand-400',
    accentBrown: isDark ? 'text-coinest-accent-brown' : 'text-neutral-600',

    // Card styles
    card: isDark
      ? 'bg-coinest-bg-secondary border-coinest-border'
      : 'bg-white border-neutral-200',

    cardHover: isDark
      ? 'hover:border-coinest-border/80'
      : 'hover:border-neutral-300',

    // Input styles
    input: isDark
      ? 'bg-coinest-bg-tertiary border-coinest-border text-white placeholder:text-coinest-text-muted focus:border-coinest-accent-cyan'
      : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-500 focus:border-brand-400',

    // Button styles
    buttonPrimary: isDark
      ? 'bg-coinest-accent-cyan text-white hover:bg-coinest-accent-cyan/90'
      : 'bg-brand-400 text-white hover:bg-brand-500',

    buttonSecondary: isDark
      ? 'bg-coinest-bg-tertiary text-white hover:bg-coinest-bg-tertiary/80 border border-coinest-border'
      : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300',

    buttonGhost: isDark
      ? 'text-coinest-text-muted hover:text-white hover:bg-coinest-bg-tertiary'
      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100',

    // Status badges
    badgeSuccess: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
    badgeWarning: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    badgeError: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
    badgeInfo: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
    badgeNeutral: isDark ? 'bg-coinest-bg-tertiary text-coinest-text-muted' : 'bg-neutral-100 text-neutral-700',

    // Risk level badges
    badgeCritical: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
    badgeHigh: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700',
    badgeMedium: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    badgeLow: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',

    // Table styles
    tableHeader: isDark ? 'bg-coinest-bg-tertiary' : 'bg-neutral-50',
    tableRow: isDark ? 'hover:bg-coinest-bg-tertiary' : 'hover:bg-neutral-50',
    tableDivider: isDark ? 'divide-coinest-border' : 'divide-neutral-200',

    // Info/Alert banners
    infoBanner: isDark
      ? 'bg-coinest-accent-cyan/10 border-coinest-accent-cyan/30'
      : 'bg-brand-50 border-brand-200',

    // Sidebar styles
    sidebarBg: isDark ? 'bg-coinest-bg-secondary' : 'bg-white',
    sidebarHover: isDark ? 'hover:bg-coinest-bg-tertiary' : 'hover:bg-neutral-100',
    sidebarActive: isDark
      ? 'bg-coinest-accent-cyan text-white'
      : 'bg-brand-400 text-white',

    // Combined utility classes
    pageWrapper: isDark ? 'bg-coinest-bg-primary' : 'bg-neutral-50',
    sectionTitle: isDark ? 'text-white' : 'text-neutral-900',
    sectionSubtitle: isDark ? 'text-coinest-text-secondary' : 'text-neutral-600',

    // Chart colors
    chartGrid: isDark ? 'stroke-coinest-border' : 'stroke-neutral-200',
    chartTooltip: isDark
      ? 'bg-coinest-bg-secondary border-coinest-border'
      : 'bg-white border-neutral-200',
  }
}

/**
 * Type for theme class keys
 */
export type ThemeClassKey = keyof ReturnType<typeof useThemeClasses>
