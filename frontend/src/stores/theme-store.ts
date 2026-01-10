/**
 * Theme Store (Zustand)
 *
 * Manages light/dark theme state for the compliance plugin with:
 * - localStorage persistence
 * - System preference detection
 * - Real-time theme switching
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'

// ============================================================================
// Types
// ============================================================================

type Theme = 'light' | 'dark'

interface ThemeState {
  /** Current theme mode */
  theme: Theme

  /** Whether theme has been initialized (hydrated from localStorage) */
  isHydrated: boolean
}

interface ThemeActions {
  /** Set theme explicitly */
  setTheme: (theme: Theme) => void

  /** Toggle between light and dark */
  toggleTheme: () => void

  /** Initialize theme from localStorage or system preference */
  hydrate: () => void
}

type ThemeStore = ThemeState & ThemeActions

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus_compliance_theme'

// ============================================================================
// Store Implementation
// ============================================================================

export const useThemeStore = create<ThemeStore>((set, get) => ({
  // Initial state - defaults to dark theme for compliance dashboard
  theme: 'dark',
  isHydrated: false,

  setTheme: (theme: Theme) => {
    set({ theme })

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch (error) {
        console.error('[ThemeStore] Failed to save theme:', error)
      }
    }

    // Apply theme class to document
    applyThemeToDocument(theme)
  },

  toggleTheme: () => {
    const { theme, setTheme } = get()
    setTheme(theme === 'dark' ? 'light' : 'dark')
  },

  hydrate: () => {
    if (typeof window === 'undefined') return

    let savedTheme: Theme | null = null

    // Try to get from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored
      }
    } catch (error) {
      console.error('[ThemeStore] Failed to read theme:', error)
    }

    // Fallback to system preference if no saved theme
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      savedTheme = prefersDark ? 'dark' : 'light'
    }

    set({ theme: savedTheme, isHydrated: true })
    applyThemeToDocument(savedTheme)
  },
}))

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply theme class to document element for CSS targeting
 */
function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

// ============================================================================
// Hook for easier consumption
// ============================================================================

/**
 * Hook for easier consumption of theme store.
 * Uses useShallow to prevent TDZ errors in minified bundles.
 */
export const useTheme = () => {
  const { theme, isHydrated, toggleTheme, setTheme } = useThemeStore(
    useShallow((state) => ({
      theme: state.theme,
      isHydrated: state.isHydrated,
      toggleTheme: state.toggleTheme,
      setTheme: state.setTheme,
    }))
  )

  return { theme, isHydrated, toggleTheme, setTheme, isDark: theme === 'dark' }
}
