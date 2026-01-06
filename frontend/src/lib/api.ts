/**
 * API Client Configuration
 *
 * Axios instance configured for the Nexus Compliance API.
 */

import axios, { AxiosError, AxiosResponse } from 'axios'

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nexus_auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
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
