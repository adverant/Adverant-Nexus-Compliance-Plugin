'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme-store'

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Theme Provider
 *
 * Initializes theme from localStorage/system preference on mount.
 * Wraps the app to ensure theme is properly hydrated before rendering.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const hydrate = useThemeStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return <>{children}</>
}
