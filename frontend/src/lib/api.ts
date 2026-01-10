/**
 * API Client Configuration
 *
 * Axios instance configured for the Nexus Compliance API.
 * Supports both direct API access and proxy access via auth_token.
 */

import axios, { AxiosError, AxiosResponse } from 'axios'

// Get auth token from URL query param (for proxy access) or localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try URL query param first (for proxy access via plugin proxy)
  const urlParams = new URLSearchParams(window.location.search)
  const queryToken = urlParams.get('auth_token')
  if (queryToken) return queryToken

  // Try localStorage
  const stored = localStorage.getItem('nexus_auth_token')
  if (stored) return stored

  return null
}

// Determine API base URL based on environment
function getApiBaseUrl(): string {
  // If NEXT_PUBLIC_COMPLIANCE_API_URL is set at build time, use it
  if (process.env.NEXT_PUBLIC_COMPLIANCE_API_URL) {
    return process.env.NEXT_PUBLIC_COMPLIANCE_API_URL
  }

  // Check for runtime config via window object (set by deployment)
  if (typeof window !== 'undefined' && (window as any).__COMPLIANCE_API_URL__) {
    return (window as any).__COMPLIANCE_API_URL__
  }

  // When running on api.adverant.ai, use the proper API path
  if (typeof window !== 'undefined' && window.location.host === 'api.adverant.ai') {
    return '/api/v1/compliance'
  }

  // Default to relative path for same-origin API access
  return '/api/v1/compliance'
}

const API_BASE_URL = getApiBaseUrl()

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from URL param or localStorage
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add tenant ID if available (for multi-tenant support)
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('nexus_tenant_id')
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexus_auth_token')
        // Could dispatch logout action or redirect
      }
    }
    return Promise.reject(error)
  }
)

export default api