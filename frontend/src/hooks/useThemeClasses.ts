/**
 * Theme Classes Hook
 *
 * Provides consistent theme-aware CSS class strings for compliance plugin components.
 * Follows the Coinest dark theme + light theme counterparts.
 */

import { useTheme } from '@/stores/theme-store'

// ============================================================================
// Theme Color Constants for Charts and Visualizations
// ============================================================================

/**
 * Theme-aware color palette for charts, graphs, and visualizations.
 * Use these for consistent colors across all data visualizations.
 */
export const THEME_COLORS = {
  /** Risk level colors */
  risk: {
    critical: { dark: '#ef4444', light: '#dc2626' },
    high: { dark: '#f97316', light: '#ea580c' },
    medium: { dark: '#eab308', light: '#ca8a04' },
    low: { dark: '#22c55e', light: '#16a34a' },
  },
  /** Status colors */
  status: {
    success: { dark: '#22c55e', light: '#16a34a' },
    warning: { dark: '#eab308', light: '#ca8a04' },
    error: { dark: '#ef4444', light: '#dc2626' },
    info: { dark: '#3b82f6', light: '#2563eb' },
    neutral: { dark: '#6b7280', light: '#4b5563' },
  },
  /** Framework color palette for multi-series charts */
  framework: [
    { dark: '#4faeca', light: '#0891b2' }, // Cyan
    { dark: '#3b82f6', light: '#2563eb' }, // Blue
    { dark: '#8b5cf6', light: '#7c3aed' }, // Purple
    { dark: '#ec4899', light: '#db2777' }, // Pink
    { dark: '#14b8a6', light: '#0d9488' }, // Teal
    { dark: '#f59e0b', light: '#d97706' }, // Amber
  ],
  /** Accent colors */
  accent: {
    cyan: { dark: '#4faeca', light: '#0891b2' },
    brown: { dark: '#a3866a', light: '#78716c' },
  },
  /** Background colors for chart areas */
  chartBg: {
    primary: { dark: '#0f172a', light: '#f8fafc' },
    secondary: { dark: '#1e293b', light: '#ffffff' },
    tertiary: { dark: '#334155', light: '#f1f5f9' },
  },
  /** Grid and axis colors */
  grid: {
    line: { dark: '#334155', light: '#e2e8f0' },
    text: { dark: '#94a3b8', light: '#64748b' },
  },
  /** EU Trustworthy AI requirement colors */
  requirement: {
    human_agency_oversight: { dark: '#3b82f6', light: '#2563eb' },
    technical_robustness_safety: { dark: '#22c55e', light: '#16a34a' },
    privacy_data_governance: { dark: '#8b5cf6', light: '#7c3aed' },
    transparency: { dark: '#f59e0b', light: '#d97706' },
    diversity_fairness_nondiscrimination: { dark: '#ec4899', light: '#db2777' },
    societal_environmental_wellbeing: { dark: '#14b8a6', light: '#0d9488' },
    accountability: { dark: '#6366f1', light: '#4f46e5' },
  },
} as const

/**
 * Get a risk level color based on theme
 */
export function getRiskColor(level: 'critical' | 'high' | 'medium' | 'low', isDark: boolean): string {
  return isDark ? THEME_COLORS.risk[level].dark : THEME_COLORS.risk[level].light
}

/**
 * Get a status color based on theme
 */
export function getStatusColor(status: 'success' | 'warning' | 'error' | 'info' | 'neutral', isDark: boolean): string {
  return isDark ? THEME_COLORS.status[status].dark : THEME_COLORS.status[status].light
}

/**
 * Get framework colors array for the current theme
 */
export function getFrameworkColors(isDark: boolean): string[] {
  return THEME_COLORS.framework.map(c => isDark ? c.dark : c.light)
}

// ============================================================================
// Theme Classes Hook
// ============================================================================

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

// ============================================================================
// Theme Colors Hook for Charts
// ============================================================================

/**
 * Hook that returns theme-aware colors for charts and visualizations.
 * Use this in components that need direct color values (not CSS classes).
 */
export function useThemeColors() {
  const { isDark } = useTheme()

  return {
    isDark,
    /** Risk level colors */
    risk: {
      critical: getRiskColor('critical', isDark),
      high: getRiskColor('high', isDark),
      medium: getRiskColor('medium', isDark),
      low: getRiskColor('low', isDark),
    },
    /** Status colors */
    status: {
      success: getStatusColor('success', isDark),
      warning: getStatusColor('warning', isDark),
      error: getStatusColor('error', isDark),
      info: getStatusColor('info', isDark),
      neutral: getStatusColor('neutral', isDark),
    },
    /** Framework colors for multi-series charts */
    framework: getFrameworkColors(isDark),
    /** Accent colors */
    accent: {
      cyan: isDark ? THEME_COLORS.accent.cyan.dark : THEME_COLORS.accent.cyan.light,
      brown: isDark ? THEME_COLORS.accent.brown.dark : THEME_COLORS.accent.brown.light,
    },
    /** Chart background colors */
    chartBg: {
      primary: isDark ? THEME_COLORS.chartBg.primary.dark : THEME_COLORS.chartBg.primary.light,
      secondary: isDark ? THEME_COLORS.chartBg.secondary.dark : THEME_COLORS.chartBg.secondary.light,
      tertiary: isDark ? THEME_COLORS.chartBg.tertiary.dark : THEME_COLORS.chartBg.tertiary.light,
    },
    /** Grid and axis colors */
    grid: {
      line: isDark ? THEME_COLORS.grid.line.dark : THEME_COLORS.grid.line.light,
      text: isDark ? THEME_COLORS.grid.text.dark : THEME_COLORS.grid.text.light,
    },
    /** EU Trustworthy AI requirement colors */
    requirement: {
      human_agency_oversight: isDark ? THEME_COLORS.requirement.human_agency_oversight.dark : THEME_COLORS.requirement.human_agency_oversight.light,
      technical_robustness_safety: isDark ? THEME_COLORS.requirement.technical_robustness_safety.dark : THEME_COLORS.requirement.technical_robustness_safety.light,
      privacy_data_governance: isDark ? THEME_COLORS.requirement.privacy_data_governance.dark : THEME_COLORS.requirement.privacy_data_governance.light,
      transparency: isDark ? THEME_COLORS.requirement.transparency.dark : THEME_COLORS.requirement.transparency.light,
      diversity_fairness_nondiscrimination: isDark ? THEME_COLORS.requirement.diversity_fairness_nondiscrimination.dark : THEME_COLORS.requirement.diversity_fairness_nondiscrimination.light,
      societal_environmental_wellbeing: isDark ? THEME_COLORS.requirement.societal_environmental_wellbeing.dark : THEME_COLORS.requirement.societal_environmental_wellbeing.light,
      accountability: isDark ? THEME_COLORS.requirement.accountability.dark : THEME_COLORS.requirement.accountability.light,
    },
  }
}

/**
 * Type for theme colors
 */
export type ThemeColors = ReturnType<typeof useThemeColors>
